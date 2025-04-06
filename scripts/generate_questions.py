import json
import math

RESULTS_PER_FILE = 20000
MAX_SENTENCE_LENGTH = 5

def generate_sentences(results, so_far, depth, rule, parts):
    if len(rule) == 0 and depth <= MAX_SENTENCE_LENGTH:
        text = so_far[:-1]
        has_words = set()
        for word in text.split(" "):
            if word in has_words:
                return
            has_words.add(word)

        results.add(text + "?")
        return
    if depth >= MAX_SENTENCE_LENGTH:
        return

    allowed_parts = rule[0]
    if isinstance(allowed_parts, str):
        allowed_parts = [allowed_parts]

    for part in allowed_parts:
        for word in parts[part]:
            generate_sentences(
                results,
                so_far + word + " ",
                depth + 1,
                rule[1:],
                parts,
            )

            if part == 'noun':
                for art in parts['article']:
                    generate_sentences(
                        results,
                        so_far + art + " " + word + " ",
                        depth + 2,
                        rule[1:],
                        parts,
                    )
    

def main():
    # available words
    words = None
    with open('../data/words.json') as f:
        words = json.load(f)
    
    # grammatical rules
    rules = None
    with open('../data/rules.json') as f:
        rules = json.load(f)

    prompt = """This is a very large list of sentences. I want you to filter this list. Return only the entries of this list that fit the following criteria:
1) Is in the form of a question
2) Follows the rules of english grammar
3) Makes semantic sense
So, for example, these are sentences you would keep:
does alice chase the ball?
am i alive?
who is evan?
is the cave alive?
These are sentences you would remove:
is i alive? (incorrect conjugation of the word i)
evan is here? (This is a statement, not a question)
is alice fire? (Doesn't make semantic sense, what would this sentence mean?)
can arizona kill? (Also doesn't make semantic sense)
is the arizona big? (Arizona is a state. It shouldn't have the article 'the' in front of it)
fire alice run? (Doesn't make grammatical sense)

Return only the filtered list. Nothing else. Here is the list:"""
    
    parts = {}
    for word in words:
        for part in words[word]["types"]:
            if part not in parts:
                parts[part] = []
            parts[part].append(word)
    
    results = set()
    for rule in rules:
        generate_sentences(results, "", 0, rule, parts)
    results = list(results)
    
    num_files = math.ceil(len(results) / RESULTS_PER_FILE)
    for f in range(num_files):
        with open(f"./output_{f}.log", "w") as output_file:
            output_file.write(prompt)
            output_file.write("\n\n")
            for i in range(f * RESULTS_PER_FILE, min(len(results), (f+1) * RESULTS_PER_FILE)):
                output_file.write(results[i])
                output_file.write("\n")
    
    print(f"Generated {len(results)} results across {num_files} files")


main()