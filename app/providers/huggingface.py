import os

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer


model = None
tokenizer = None


def load_model_nlp():
    global model, tokenizer

    if model is not None and tokenizer is not None:
        return model, tokenizer

    model_name = os.getenv("HF_MODEL_ID")

    if not model_name:
        raise ValueError("HF_MODEL_ID is not configured")

    tokenizer = AutoTokenizer.from_pretrained(model_name)

    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        torch_dtype="auto",
        device_map="auto",
    )

    model.eval()

    return model, tokenizer


async def get_hf_response(context: list[dict[str, str]]):
    model, tokenizer = load_model_nlp()

    text = tokenizer.apply_chat_template(
        context,
        tokenize=False,
        add_generation_prompt=True,
    )

    model_inputs = tokenizer(
        [text],
        return_tensors="pt",
    ).to(model.device)

    generated_ids = model.generate(
        **model_inputs,
        max_new_tokens=512,
        top_p=0.9,
        temperature=0.7,
        do_sample=True,
        pad_token_id=tokenizer.eos_token_id,
    )

    generated_ids = [
        output_ids[len(input_ids) :]
        for input_ids, output_ids in zip(
            model_inputs.input_ids,
            generated_ids,
        )
    ]

    return tokenizer.batch_decode(
        generated_ids,
        skip_special_tokens=True,
    )[0]
