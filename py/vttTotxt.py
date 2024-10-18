import re

with open("GMT20241010-180422_Recording.transcript.vtt", "r") as f:
    content = f.read()

text = re.findall(r"WEBVTT\n.*?\n(.*?)\n", content, re.DOTALL)

with open("output.txt", "w") as f:
    f.write("\n".join(text))
