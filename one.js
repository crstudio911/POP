(function () {
  const form = document.getElementById("grab");
  const input = document.getElementById("link");
  const hint = document.getElementById("hint");
  const paste = document.getElementById("paste");

  function normalize(value) {
    const text = value.trim();
    if (!text) return "";
    const withScheme = /^https?:\/\//i.test(text) ? text : "https://" + text;
    try {
      const url = new URL(withScheme);
      if (!url.hostname.includes(".")) return "";
      return url.href;
    } catch (error) {
      return "";
    }
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const url = normalize(input.value);
    if (!url) {
      hint.textContent = "الرابط ده مش صحيح. اتأكد إنه رابط كامل.";
      input.focus();
      return;
    }
    hint.textContent = "";
    location.href = "main/main.html?url=" + encodeURIComponent(url);
  });

  input.addEventListener("input", function () {
    hint.textContent = "";
  });

  paste.addEventListener("click", async function () {
    try {
      const text = await navigator.clipboard.readText();
      if (text) input.value = text.trim();
      input.focus();
    } catch (error) {
      hint.textContent = "المتصفح منع اللصق. الصق الرابط بإيدك.";
    }
  });
})();
