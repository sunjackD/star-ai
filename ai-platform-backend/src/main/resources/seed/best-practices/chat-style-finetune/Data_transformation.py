#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
WeChat export JSON -> Chat SFT JSONL

关键改动：
1) 保留 引用消息(type="引用消息")：它在导出里就是正文文本的一种（否则会丢掉大量口吻样本）
2) 抑制“嗯/OK/。？”类低信息 assistant：过滤 + 限额，避免风格被稀释
3) SYSTEM_PROMPT 支持多模板随机采样：训练时让“短提示”也能触发
4) 去重：同一 (user_text, asst_text) 只保留一次
"""

import json
import random
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# ===================== 你需要改的配置 =====================
INPUT_JSON_PATH = r"N:\聊天记录导出\xx\1767784709772.json"
OUT_TRAIN_JSONL = "train.jsonl"
OUT_VAL_JSONL = "val.jsonl"

TARGET_USERNAME = "wxid_xxxxxxx3522"  #  senderUsername
MERGE_GAP_SECONDS = 300                  # 5分钟内同一人连发合并
LOOKAHEAD = 3                            # 向后找第一条目标回复

VAL_RATIO = 0.1
RANDOM_SEED = 42

# —— 系统提示词：建议用“短但信息密度高”的版本作为主力 —— #
SHORT_SYSTEM_PROMPT = (
    "你是xx，用微信聊天口吻回复xx：短句+多换行，先回答问题再吐槽；"
    "常用“笑死我了/xx/xx”等口头禅；表情用[憨笑][强][捂脸][xx][xx]。"
)

# 你的长人设提示词（可选：占比不要太高，避免模型只在长prompt下像）
LONG_SYSTEM_PROMPT = (
    "# Role Description\n"
    "你现在需要完全沉浸式地扮演“xx”（用户有时叫她“xxx”），你是用户（xxx）的xxx，也是他的xxx。\n"
    "# Personality & Vibe\n"
    "直爽、傲娇、幽默、稍微毒舌；先回答问题本身，不许人身攻击，别复读同一个词；不确定就反问一条具体问题（最多一句）。\n"
    "# Speaking Style\n"
    "短句为主，经常拆两三行；口头禅：笑死我了/神经/包的/。？/我勒个/挖槽；"
    "表情：必须频繁使用[憨笑][强][捂脸][xx][xx]等。\n"
)

# 采样比例：大多数用短prompt，少量用长prompt（让短prompt可触发风格）
SYSTEM_PROMPTS = [SHORT_SYSTEM_PROMPT, LONG_SYSTEM_PROMPT]
SYSTEM_PROMPT_WEIGHTS = [0.8, 0.2]

# —— 低信息样本抑制 —— #
# 去掉“只有表情/标点/超短”的 assistant
MIN_ASSISTANT_CONTENT_CHARS = 4   # 建议 4~8，越大越能抑制“嗯嗯怪”，但样本会变少
MIN_USER_CHARS = 1

# 允许保留的“低信息回复”上限（按文本去重后再限额）
LOW_INFO_MAX_PER_TEXT = 3

# user/assistant 都很短就丢（你原来的逻辑保留）
DROP_BOTH_TOO_SHORT = True

# =========================================================

ANIM_EMOJI_TEXT_RE = re.compile(r"^\[动画表情(?::[0-9a-fA-F]{8,})?\]$")
BRACKET_EMOJI_RE = re.compile(r"\[[^\]]+\]")

def _norm_text(s: Optional[str]) -> str:
    return (s or "").strip()

def _strip_emojis_and_punct(s: str) -> str:
    s = BRACKET_EMOJI_RE.sub("", s)
    s = re.sub(r"\s+", "", s)
    # 去掉常见标点符号
    s = re.sub(r"[。．\.，,！？!\?、~～…\-—_（）()\[\]{}“”\"'`]+", "", s)
    return s

def _is_low_info(text: str) -> bool:
    # 只表情/只标点/极短都算低信息
    core = _strip_emojis_and_punct(text)
    return len(core) < 2

def _msg_to_text(m: Dict[str, Any]) -> Optional[str]:
    """把单条导出消息转为可训练文本。返回 None 表示丢弃。"""
    mtype = m.get("type")
    content = _norm_text(m.get("content"))

    # ✅ 关键：把“引用消息”也当文本保留
    if mtype in ("文本消息", "引用消息"):
        if not content:
            return None
        # 保险：如果历史数据里混入“动画表情占位文本”，也丢掉
        if ANIM_EMOJI_TEXT_RE.match(content):
            return None
        return content

    # 动画表情一律丢弃
    if mtype == "动画表情":
        return None

    # 系统消息、图片、视频、语音、文件等一律丢弃
    return None

def load_export(path: str) -> List[Dict[str, Any]]:
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    if isinstance(data, dict) and "messages" in data:
        msgs = data["messages"]
    elif isinstance(data, list):
        msgs = data
    else:
        raise ValueError("不认识的JSON结构：顶层应为 dict(含messages) 或 list。")
    msgs.sort(key=lambda x: (int(x.get("createTime", 0)), int(x.get("localId", 0))))
    return msgs

def build_turns(msgs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    合并连续消息为 turns：
    每个 turn: {speaker, t_first, t_last, text}
    """
    turns: List[Dict[str, Any]] = []
    last: Optional[Dict[str, Any]] = None

    for m in msgs:
        speaker = _norm_text(m.get("senderUsername"))
        if not speaker:
            continue

        ct = int(m.get("createTime", 0))
        text = _msg_to_text(m)
        if text is None:
            continue

        if last and last["speaker"] == speaker and (ct - last["t_last"]) <= MERGE_GAP_SECONDS:
            last["text"] += "\n" + text
            last["t_last"] = ct
        else:
            last = {"speaker": speaker, "t_first": ct, "t_last": ct, "text": text}
            turns.append(last)

    return turns

def make_pairs_window(turns: List[Dict[str, Any]]) -> List[Tuple[str, str]]:
    """
    生成 (user_text, assistant_text) 样本对（窗口配对版）：
    - 当 turn[i] 是“非目标”说的话时，在后面 LOOKAHEAD 个 turn 内寻找第一条“目标”回复来配对
    - 找到后，i 跳到目标回复后继续，避免重复使用同一条目标回复
    """
    pairs: List[Tuple[str, str]] = []
    i = 0

    while i < len(turns) - 1:
        a = turns[i]

        # 只从“非目标”说话开始找
        if a["speaker"] == TARGET_USERNAME:
            i += 1
            continue

        user_text = _norm_text(a["text"])
        if not user_text or len(user_text) < MIN_USER_CHARS:
            i += 1
            continue

        found_j: Optional[int] = None
        upper = min(i + 1 + LOOKAHEAD, len(turns))
        for j in range(i + 1, upper):
            if turns[j]["speaker"] == TARGET_USERNAME:
                asst_text = _norm_text(turns[j]["text"])
                if asst_text:
                    found_j = j
                    break

        if found_j is None:
            i += 1
            continue

        asst_text = _norm_text(turns[found_j]["text"])

        # 过滤：双短丢（保留你原逻辑）
        if DROP_BOTH_TOO_SHORT and len(user_text) < 4 and len(asst_text) < 4:
            i = found_j + 1
            continue

        pairs.append((user_text, asst_text))
        i = found_j + 1

    return pairs

def filter_and_dedup_pairs(pairs: List[Tuple[str, str]]) -> List[Tuple[str, str]]:
    # 1) 去重
    seen = set()
    uniq = []
    for u, a in pairs:
        key = (u, a)
        if key in seen:
            continue
        seen.add(key)
        uniq.append((u, a))

    # 2) 强力抑制低信息 assistant：短+低信息直接丢；低信息文本限额
    low_info_counter: Dict[str, int] = {}
    out: List[Tuple[str, str]] = []
    for u, a in uniq:
        a_core_len = len(_strip_emojis_and_punct(a))
        if a_core_len < MIN_ASSISTANT_CONTENT_CHARS:
            # 太短直接丢（这一条对“嗯嗯怪”影响最大）
            continue

        if _is_low_info(a):
            low_info_counter[a] = low_info_counter.get(a, 0) + 1
            if low_info_counter[a] > LOW_INFO_MAX_PER_TEXT:
                continue

        out.append((u, a))

    return out

def to_jsonl_lines(pairs: List[Tuple[str, str]]) -> List[str]:
    lines: List[str] = []
    for user_text, asst_text in pairs:
        sys_prompt = random.choices(SYSTEM_PROMPTS, weights=SYSTEM_PROMPT_WEIGHTS, k=1)[0]
        obj = {
            "messages": [
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": user_text},
                {"role": "assistant", "content": asst_text},
            ]
        }
        lines.append(json.dumps(obj, ensure_ascii=False))
    return lines

def split_train_val(lines: List[str]) -> Tuple[List[str], List[str]]:
    random.seed(RANDOM_SEED)
    idx = list(range(len(lines)))
    random.shuffle(idx)

    val_n = max(1, int(len(lines) * VAL_RATIO)) if len(lines) >= 10 else 0
    val_set = set(idx[:val_n])

    train_lines, val_lines = [], []
    for i, line in enumerate(lines):
        (val_lines if i in val_set else train_lines).append(line)
    return train_lines, val_lines

def write_lines(path: str, lines: List[str]) -> None:
    Path(path).write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")

def main():
    random.seed(RANDOM_SEED)

    msgs = load_export(INPUT_JSON_PATH)
    turns = build_turns(msgs)
    pairs = make_pairs_window(turns)
    pairs = filter_and_dedup_pairs(pairs)

    lines = to_jsonl_lines(pairs)
    train_lines, val_lines = split_train_val(lines)

    write_lines(OUT_TRAIN_JSONL, train_lines)
    if val_lines:
        write_lines(OUT_VAL_JSONL, val_lines)

    print("=== 转换完成（保留引用消息 + 抑制低信息回复 + system混合采样）===")
    print(f"原始消息数: {len(msgs)}")
    print(f"合并后turn数: {len(turns)}")
    print(f"过滤后样本对数(pairs): {len(pairs)}")
    print(f"train行数: {len(train_lines)} -> {OUT_TRAIN_JSONL}")
    print(f"val行数:   {len(val_lines)} -> {OUT_VAL_JSONL}")
    print("说明：已保留 type=引用消息（当作文本）；已丢弃所有 type=动画表情。")
    print(f"说明：system prompt 混合采样比例={SYSTEM_PROMPT_WEIGHTS}（短prompt为主）。")
    print(f"说明：MIN_ASSISTANT_CONTENT_CHARS={MIN_ASSISTANT_CONTENT_CHARS}，LOW_INFO_MAX_PER_TEXT={LOW_INFO_MAX_PER_TEXT}")

if __name__ == "__main__":
    main()
