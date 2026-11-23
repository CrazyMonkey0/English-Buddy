from openai import AsyncOpenAI
from schemas.ai_response import EnglishBuddyResponse
import os


client = AsyncOpenAI(api_key=os.getenv("AI_API_KEY"))


async def get_openai_response(context: list[dict[str, str]]):
    result = await client.responses.parse(
        model=os.getenv("MODEL_ID"),
        input=context,
        text_format=EnglishBuddyResponse,
    )

    parsed = result.output_parsed

    if parsed is None:
        raise ValueError("OpenAI returned an empty structured response")

    return parsed
