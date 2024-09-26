import sys
from transformers import pipeline
import warnings
warnings.filterwarnings('ignore')

def process_quest(quest):
    pipe = pipeline("text-generation", "ardeny/gp_llama")
    result = pipe(f"<s>[INST] {prompt} [/INST]")
    return result[0]['generated_text']

if __name__ == "__main__":
    if len(sys.argv) > 1:
        quest = sys.argv[1]
        answer = process_quest(quest)
        print(answer)
    else:
        print("No quest provided")
