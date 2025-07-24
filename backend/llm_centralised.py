import os

from httplib2.auth import token
from openai import OpenAI
from openai import RateLimitError as OpenAIRateLimit, AuthenticationError as OpenAIAuth, APIError
import google.generativeai as genai
from google.api_core.exceptions import PermissionDenied as GooglePermissionDenied, ResourceExhausted, GoogleAPIError
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

class LLMUsage:
    def __init__(self, token_prompt: int, token_total: int):
        self.token_prompt = token_prompt
        self.token_total = token_total

    def to_dict(self) -> dict[str, int]:
        return {
            "token_prompt": self.token_prompt,
            "token_total": self.token_total
        }

class LLMResponse:
    def __init__(self, text: str, usage: LLMUsage):
        self.text: str = text
        self.usage: dict[str, int] = usage.to_dict()

class LLMBase:
    def __init__(self, api_key: str):
        self.total_token_used = 0
        self.api_key = api_key

    def get_weight(self) -> float:
        return 1.0

    def generate_response(self, prompt: str) -> LLMResponse:
        raise Exception("Unimplemented generate_response function")

    def compute_load(self, prompt_length: int, response_length: int) -> float:
        return (prompt_length + response_length) * self.get_weight()

    def __str__(self):
        return f"{self.__class__.__name__}{{api=...{self.api_key[-10:]}}}"

class LLMOpenAI(LLMBase):
    def __init__(self, api_key):
        super().__init__(api_key)
        self.client = OpenAI(
            base_url=os.getenv("OPENAI_BASE_URL", "https://models.github.ai/inference"),
            api_key=api_key
        )

    def get_weight(self) -> float:
        return 10.0  # GPT is expensive

    def generate_response(self, prompt: str) -> LLMResponse:
        response = self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        return LLMResponse(
            response.choices[0].message.content.strip(),
            LLMUsage(
                response.usage.prompt_tokens,
                response.usage.total_tokens
            )
        )


class LLMGemini(LLMBase):
    def __init__(self, api_key):
        super().__init__(api_key)
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')

    def get_weight(self) -> float:
        return 1.0

    def generate_response(self, prompt: str) -> LLMResponse:
        response = self.model.generate_content(prompt)
        return LLMResponse(
            response.text,
            LLMUsage(response.usage_metadata.prompt_token_count,
                     response.usage_metadata.total_token_count)
        )


class LLMCentralised(LLMBase):
    def __init__(self):
        super().__init__("Undefined")
        self.models: list[LLMBase] = []

        for key in os.getenv("GEMINI_API_KEY_LIST", "").split(","):
            if key.strip():
                self.models.append(LLMGemini(key.strip()))

        for key in os.getenv("GITHUB_TOKEN_LIST", "").split(","):
            if key.strip():
                self.models.append(LLMOpenAI(key.strip()))

    def generate_response(self, prompt: str) -> LLMResponse:
        attempts = 0
        tried = set()
        error_str = ""

        while attempts < 3 and len(tried) < len(self.models):
            available_models = sorted(
                [(i, m, m.total_token_used * m.get_weight()) for i, m in enumerate(self.models) if i not in tried],
                key=lambda x: x[2]
            )

            if not available_models:
                raise Exception("No available models")

            idx, model, _ = available_models[0]
            tried.add(idx)

            print(f"[LLMCentral] Using model {idx}: {model}")
            try:
                output = model.generate_response(prompt)
                total_tokens = output.usage["token_total"]
                model.total_token_used += total_tokens
                self.total_token_used += total_tokens
                return output
            except (OpenAIRateLimit, ResourceExhausted) as e:
                error_str = f"Rate limit reached: {e}"
            except (OpenAIAuth, GooglePermissionDenied) as e:
                error_str = f"API access denied: {e}"
            except (APIError, GoogleAPIError) as e:
                error_str = f"API Error: {e}"
            except Exception as e:
                error_str = str(e)
            print(f"[Model {idx}] {error_str}")

        raise RuntimeError(error_str)

    @property
    def total_models(self) -> int:
        return len(self.models)

    def __str__(self):
        models_str = ",\n  ".join([str(i) for i in self.models])
        return f"{self.__class__.__name__} ({self.total_models})[\n  {models_str}\n]"

llmCentral = LLMCentralised()

if __name__ == '__main__':
    print(llmCentral)
    for i in range(llmCentral.total_models):
        _response = llmCentral.generate_response("Respond with 'ok'")
        print(_response.text, _response.usage, sep="\n")