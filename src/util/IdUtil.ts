export function repeat(str: string, n: number): string {
  let res = "";
  for (let i = 0; i < n; i++) {
    res += str;
  }
  return res;
}

export function randomId(): string {
  let str = "";
  for (let i = 0; i < 4; i++) {
    str += Math.random()
      .toString()
      .replace(/\./, "");
  }
  str = "uid" + str;
  // 取前32位随机字符，不足补0
  return str.length >= 32
    ? str.substr(0, 32)
    : str + repeat("0", 32 - str.length);
}
