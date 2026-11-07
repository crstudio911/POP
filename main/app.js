(function () {
  const api = (window.POP_CONFIG && window.POP_CONFIG.api) || "";
  const form = document.getElementById("grab");
  const input = document.getElementById("link");
  const button = document.getElementById("go");
  const state = document.getElementById("state");

  const platforms = {
    youtube: "يوتيوب",
    instagram: "إنستجرام",
    facebook: "فيسبوك",
    tiktok: "تيك توك",
    x: "إكس",
    vimeo: "فيميو",
    soundcloud: "ساوند كلاود",
    reddit: "ريديت",
    web: "موقع ويب",
  };

  const brand = {
    youtube: "#FF0000",
    instagram: "#E4405F",
    facebook: "#1877F2",
    tiktok: "#25F4EE",
    x: "#FFFFFF",
    vimeo: "#1AB7EA",
    soundcloud: "#FF5500",
    reddit: "#FF4500",
  };

  const errors = {
    invalid_url: ["الرابط مش صحيح", "اتأكد إنك نسخت الرابط كامل وجرب تاني."],
    invalid_body: ["الطلب مش مفهوم", "جرب تلصق الرابط تاني."],
    blocked_host: ["الرابط ده ممنوع", "مينفعش نفتح روابط الشبكات الداخلية."],
    no_media: ["ملقيناش فيديو", "الصفحة دي مفيهاش ملف فيديو نقدر نوصله."],
    login_required: ["المحتوى ده محتاج تسجيل دخول", "المحتوى خاص أو محمي، ومش بنقدر نحمل غير المحتوى العام."],
    unavailable: ["الفيديو مش متاح", "ممكن يكون اتمسح أو مقفول في بلدك."],
    upstream_failed: ["الموقع مردش", "الموقع الأصلي رفض الطلب أو وقع. جرب كمان شوية."],
    missing_secret: ["السيرفر مش متظبط", "لسه مفتاح الأمان SECRET مش متضاف للسيرفر."],
    network: ["مش قادرين نوصل للسيرفر", "اتأكد من النت وجرب تاني. الموقع شغال بس من crstudio911.github.io."],
    not_allowed: ["الموقع ده مش مسموحله", "رابط الموقع ده مش متضاف في ALLOW على السيرفر."],
    server_error: ["حصلت مشكلة", "حاجة غلط حصلت عندنا. جرب تاني."],
    engine_down: ["محرك التحميل نايم", "المحرك بيصحى خلال دقيقة لو كان واقف. جرب تاني بعد شوية."],
    busy: ["فيه ضغط دلوقتي", "فيه تحميلات كتير شغالة. جرب كمان دقيقة."],
    expired: ["الرابط خلص", "روابط التحميل بتنتهي بعد 6 ساعات. الصق الرابط تاني."],
  };

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function formatSize(bytes) {
    if (!bytes) return "";
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + " GB";
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + " MB";
    return Math.max(1, Math.round(bytes / 1024)) + " KB";
  }

  function formatDuration(seconds) {
    if (!seconds) return "";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const pad = function (n) {
      return String(n).padStart(2, "0");
    };
    return h ? h + ":" + pad(m) + ":" + pad(s) : m + ":" + pad(s);
  }

  function itemTitle(item) {
    if (item.kind === "audio") return item.ext === "mp3" ? "صوت فقط MP3" : "صوت فقط";
    if (item.kind === "image") return "صورة";
    if (!item.hasAudio) return "فيديو بدون صوت";
    return "فيديو";
  }

  function normalize(value) {
    const text = value.trim();
    if (!text) return "";
    const withScheme = /^https?:\/\//i.test(text) ? text : "https://" + text;
    try {
      const url = new URL(withScheme);
      return url.hostname.includes(".") ? url.href : "";
    } catch (error) {
      return "";
    }
  }

  function orbit() {
    const box = el("span", "orbit");
    const img = el("img");
    img.src = "../img/logo.png";
    img.alt = "";
    box.append(img);
    return box;
  }

  function showLoading() {
    state.replaceChildren();
    const loader = el("div", "loader");
    loader.append(orbit(), el("span", "", "بندور على الفيديو والجودات..."));
    state.append(loader);
    const card = el("div", "card skeleton");
    const thumb = el("div", "thumb shimmer");
    thumb.append(orbit());
    card.append(thumb);
    const meta = el("div", "meta");
    meta.append(el("div", "shimmer line w60"), el("div", "shimmer line w40"), el("div", "shimmer line tall"), el("div", "shimmer line tall"));
    card.append(meta);
    state.append(card);
  }

  function showError(code) {
    const pair = errors[code] || errors.server_error;
    const box = el("div", "error");
    box.append(el("h2", "", pair[0]), el("p", "", pair[1]));
    state.replaceChildren(box);
  }

  function showResult(data) {
    const card = el("article", "card");
    const thumb = el("div", "thumb");
    if (data.thumbnail) {
      const img = el("img");
      img.src = data.thumbnail;
      img.alt = data.title || "";
      img.loading = "lazy";
      img.referrerPolicy = "no-referrer";
      img.addEventListener("error", function () {
        img.remove();
      });
      thumb.append(img);
    }
    const duration = formatDuration(data.duration);
    if (duration) thumb.append(el("span", "badge", duration));

    const meta = el("div", "meta");
    meta.append(el("h1", "", data.title || "بدون عنوان"));
    const platform = el("p", "platform");
    const pf = el("i", "ic");
    pf.setAttribute("aria-hidden", "true");
    pf.style.setProperty("--ic", brand[data.platform] ? "url(../img/platforms/" + data.platform + ".svg)" : "url(../img/icons/globe.svg)");
    if (brand[data.platform]) pf.style.setProperty("--pf", brand[data.platform]);
    platform.append(pf, document.createTextNode(platforms[data.platform] || platforms.web));
    meta.append(platform);

    const list = el("ul", "list");
    data.items.forEach(function (item, index) {
      const row = el("li", "row");
      const info = el("div", "row-info");
      const head = [itemTitle(item), item.quality].filter(Boolean).join(" · ");
      info.append(el("span", "row-title", head));
      const sub = [String(item.ext || "").toUpperCase(), formatSize(item.size)].filter(Boolean).join(" · ");
      info.append(el("span", "row-sub", sub));
      const link = el("a", index === 0 ? "dl" : "dl soft");
      const icon = el("i", "ic");
      icon.style.setProperty("--ic", "url(../img/icons/download.svg)");
      icon.setAttribute("aria-hidden", "true");
      link.append(icon, document.createTextNode("تحميل"));
      link.href = item.download;
      link.rel = "noopener";
      link.setAttribute("download", "");
      row.append(info, link);
      list.append(row);
    });
    meta.append(list);

    if (data.items.some(function (item) { return item.kind === "video" && !item.hasAudio; })) {
      meta.append(el("p", "note", "الجودة دي بتيجي بدون صوت. حمل الصوت لوحده لو محتاجه."));
    }
    card.append(thumb, meta);
    state.replaceChildren(card);
  }

  async function resolve(url) {
    button.disabled = true;
    showLoading();
    try {
      const res = await fetch(api.replace(/\/$/, "") + "/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url }),
      });
      const data = await res.json().catch(function () {
        return { error: "server_error" };
      });
      if (!res.ok || data.error) {
        showError(data.error || "server_error");
        return;
      }
      if (!data.items || !data.items.length) {
        showError("no_media");
        return;
      }
      showResult(data);
    } catch (error) {
      showError("network");
    } finally {
      button.disabled = false;
    }
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const url = normalize(input.value);
    if (!url) {
      showError("invalid_url");
      return;
    }
    history.replaceState(null, "", "?url=" + encodeURIComponent(url));
    resolve(url);
  });

  const initial = new URLSearchParams(location.search).get("url") || "";
  if (initial) {
    input.value = initial;
    const url = normalize(initial);
    if (url) resolve(url);
    else showError("invalid_url");
  } else {
    state.replaceChildren(el("p", "empty", "الصق رابط فوق وابدأ."));
  }
})();
