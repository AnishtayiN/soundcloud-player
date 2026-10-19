(() => {
  "use strict";
  var _a, _b, _c;
  const API = window.SC_API || "https://fywphggwavthubehvvuh.supabase.co/functions/v1/scbot/api";
  const NATIVE = window.SCNative || null;
  const tg = NATIVE ? null : (_a = window.Telegram) == null ? void 0 : _a.WebApp;
  const initData = NATIVE ? "" : (tg == null ? void 0 : tg.initData) || new URLSearchParams(location.hash.slice(1)).get("tgWebAppData") || "";
  let appToken = NATIVE ? localStorage.getItem("sc_token") || "" : "";
  const GH_REPO = "AnishtayiN/soundcloud-player";
  const DL = {
    page: `https://github.com/${GH_REPO}/releases/latest`,
    apk: `https://github.com/${GH_REPO}/releases/latest/download/SoundCloud-Player.apk`,
    exe: `https://github.com/${GH_REPO}/releases/latest/download/SoundCloud-Player-Setup.exe`
  };
  function openExt(url) {
    if (NATIVE == null ? void 0 : NATIVE.openExternal) return NATIVE.openExternal(url);
    if (tg && /^https:\/\/t\.me\//.test(url) && tg.openTelegramLink) return tg.openTelegramLink(url);
    if (tg == null ? void 0 : tg.openLink) return tg.openLink(url);
    window.open(url, "_blank");
  }
  const STR = {
    fa: {
      home: "خانه",
      search: "جستجو",
      library: "کتابخانه",
      settings: "تنظیمات",
      hello: "سلام",
      welcome: "امروز چی گوش می‌دی؟",
      trending: "ترندهای ساندکلاد",
      top: "پر دانلودترین‌ها در ربات",
      recent: "اخیراً دانلود کردی",
      genres: "ژانرها",
      all: "همه",
      searchPh: "آهنگ، خواننده یا لینک ساندکلاد…",
      tracks: "آهنگ‌ها",
      artists: "خواننده‌ها",
      albums: "آلبوم/پلی‌لیست",
      noRes: "نتیجه‌ای پیدا نشد",
      tryElse: "یه چیز دیگه امتحان کن",
      startSearch: "جستجو کن",
      startSearchSub: "اسم آهنگ، خواننده یا لینک ساندکلاد رو بنویس",
      playlists: "پلی‌لیست‌ها",
      favorites: "علاقه‌مندی‌ها",
      newPl: "پلی‌لیست جدید",
      importPl: "ایمپورت از ساندکلاد",
      tracksN: (n) => `${n} آهنگ`,
      play: "پخش",
      shuffle: "تصادفی",
      sendAll: "ارسال به چت",
      share: "اشتراک",
      rename: "تغییر نام",
      del: "حذف",
      edit: "ویرایش",
      done: "تمام",
      public: "عمومی",
      private: "خصوصی",
      playlist: "پلی‌لیست",
      artist: "خواننده",
      album: "آلبوم",
      followers: "فالوور",
      topTracks: "ترک‌های برتر",
      latest: "جدیدترین",
      saveAsPl: "ذخیره در پلی‌لیست‌هام",
      playNext: "پخش بعدی",
      addQueue: "افزودن به صف",
      addPl: "افزودن به پلی‌لیست",
      fav: "علاقه‌مندی",
      unfav: "حذف از علاقه‌مندی",
      sendChat: "ارسال فایل به چت",
      similar: "آهنگ‌های مشابه",
      goArtist: "رفتن به خواننده",
      openSc: "باز کردن در ساندکلاد",
      removeFromPl: "حذف از پلی‌لیست",
      copyLink: "کپی لینک",
      name: "نام",
      create: "ساختن",
      cancel: "لغو",
      save: "ذخیره",
      plName: "اسم پلی‌لیست",
      scLink: "لینک پلی‌لیست/آلبوم ساندکلاد",
      import: "ایمپورت",
      sent: "📤 فایل به چت ربات ارسال شد",
      sending: "📤 در حال ارسال به چت…",
      added: "✅ اضافه شد",
      already: "ℹ️ قبلاً اضافه شده",
      favOn: "❤️ به علاقه‌مندی‌ها اضافه شد",
      favOff: "💔 حذف شد",
      created: "✅ ساخته شد",
      deleted: "🗑 حذف شد",
      copied: "✅ کپی شد",
      imported: (n) => `✅ ${n} آهنگ ایمپورت شد`,
      drm: "🔒 این آهنگ محافظت شده و قابل پخش نیست",
      err: "⚠️ خطا، دوباره امتحان کن",
      confirmDel: "این پلی‌لیست حذف بشه؟",
      queue: "صف پخش",
      nowPlaying: "در حال پخش",
      emptyPl: "این پلی‌لیست خالیه",
      emptyPlSub: "از منوی ⋯ روی هر آهنگ، به پلی‌لیست اضافه‌اش کن",
      noPl: "هنوز پلی‌لیستی نداری",
      lang: "زبان",
      quality: "کیفیت دانلود",
      qHigh: "بالاترین",
      qLow: "کم‌حجم",
      downloads: "دانلود",
      theme: "تم",
      dark: "تاریک",
      light: "روشن",
      auto: "خودکار",
      about: "درباره",
      openBot: "باز کردن ربات",
      unauthorized: "لطفاً مینی‌اپ رو از داخل ربات تلگرام باز کن",
      queueEmpty: "صف خالیه",
      repeatOne: "تکرار یک آهنگ",
      repeatAll: "تکرار همه",
      repeatOff: "بدون تکرار",
      sharedBy: "پلی‌لیست اشتراکی",
      copyToMine: "کپی به پلی‌لیست‌های من",
      loading: "در حال بارگذاری…",
      login: "ورود با تلگرام",
      loginSub: "با حساب تلگرامت وارد شو تا پلی‌لیست‌ها، علاقه‌مندی‌ها و دانلودهات با ربات همگام بشه.",
      loginWait: "توی تلگرام دکمه «Start» و بعد «✅ تایید ورود» رو بزن…",
      loginReopen: "باز کردن تلگرام",
      loginQr: "یا با دوربین گوشی این کد رو اسکن کن",
      loginExpired: "زمان ورود تموم شد، دوباره امتحان کن.",
      loginDenied: "ورود لغو شد.",
      loginOk: "خوش اومدی! 🎧",
      retry: "تلاش دوباره",
      copyLink: "کپی لینک",
      copied: "کپی شد ✅",
      logout: "خروج از حساب",
      logoutQ: "از حساب خارج می‌شی؟",
      version: "نسخه برنامه",
      checkUpd: "بررسی به‌روزرسانی",
      updTitle: "نسخه جدید آمادست 🎉",
      updAvail: (v) => `نسخه ${v} منتشر شده.`,
      updDl: "دانلود نسخه جدید",
      later: "بعداً",
      upToDate: "آخرین نسخه رو داری ✅",
      getApp: "اپ اندروید و ویندوز",
      feat: "ساخته شده با ❤️ برای عاشقای موسیقی"
    },
    en: {
      home: "Home",
      search: "Search",
      library: "Library",
      settings: "Settings",
      hello: "Hi",
      welcome: "What are we listening to today?",
      trending: "SoundCloud Trending",
      top: "Most downloaded on the bot",
      recent: "Recently downloaded",
      genres: "Genres",
      all: "All",
      searchPh: "Songs, artists or a SoundCloud link…",
      tracks: "Tracks",
      artists: "Artists",
      albums: "Albums/Playlists",
      noRes: "No results",
      tryElse: "Try something else",
      startSearch: "Search",
      startSearchSub: "Type a song, an artist or paste a SoundCloud link",
      playlists: "Playlists",
      favorites: "Favorites",
      newPl: "New playlist",
      importPl: "Import from SoundCloud",
      tracksN: (n) => `${n} tracks`,
      play: "Play",
      shuffle: "Shuffle",
      sendAll: "Send to chat",
      share: "Share",
      rename: "Rename",
      del: "Delete",
      edit: "Edit",
      done: "Done",
      public: "Public",
      private: "Private",
      playlist: "Playlist",
      artist: "Artist",
      album: "Album",
      followers: "followers",
      topTracks: "Top tracks",
      latest: "Latest",
      saveAsPl: "Save to my playlists",
      playNext: "Play next",
      addQueue: "Add to queue",
      addPl: "Add to playlist",
      fav: "Favorite",
      unfav: "Unfavorite",
      sendChat: "Send file to chat",
      similar: "Similar tracks",
      goArtist: "Go to artist",
      openSc: "Open in SoundCloud",
      removeFromPl: "Remove from playlist",
      copyLink: "Copy link",
      name: "Name",
      create: "Create",
      cancel: "Cancel",
      save: "Save",
      plName: "Playlist name",
      scLink: "SoundCloud playlist/album link",
      import: "Import",
      sent: "📤 Sent to your bot chat",
      sending: "📤 Sending to chat…",
      added: "✅ Added",
      already: "ℹ️ Already there",
      favOn: "❤️ Added to favorites",
      favOff: "💔 Removed",
      created: "✅ Created",
      deleted: "🗑 Deleted",
      copied: "✅ Copied",
      imported: (n) => `✅ Imported ${n} tracks`,
      drm: "🔒 This track is protected and can't be played",
      err: "⚠️ Error, try again",
      confirmDel: "Delete this playlist?",
      queue: "Queue",
      nowPlaying: "Now playing",
      emptyPl: "This playlist is empty",
      emptyPlSub: "Use the ⋯ menu on any track to add it here",
      noPl: "No playlists yet",
      lang: "Language",
      quality: "Download quality",
      qHigh: "Best",
      qLow: "Data saver",
      downloads: "Downloads",
      theme: "Theme",
      dark: "Dark",
      light: "Light",
      auto: "Auto",
      about: "About",
      openBot: "Open bot",
      unauthorized: "Please open this Mini App from the Telegram bot",
      queueEmpty: "Queue is empty",
      repeatOne: "Repeat one",
      repeatAll: "Repeat all",
      repeatOff: "Repeat off",
      sharedBy: "Shared playlist",
      copyToMine: "Copy to my playlists",
      loading: "Loading…",
      login: "Sign in with Telegram",
      loginSub: "Sign in with your Telegram account to sync playlists, favorites and downloads with the bot.",
      loginWait: "In Telegram tap “Start”, then “✅ Approve”…",
      loginReopen: "Open Telegram",
      loginQr: "or scan this code with your phone camera",
      loginExpired: "Sign-in timed out, please try again.",
      loginDenied: "Sign-in was cancelled.",
      loginOk: "Welcome! 🎧",
      retry: "Retry",
      copyLink: "Copy link",
      copied: "Copied ✅",
      logout: "Sign out",
      logoutQ: "Sign out of this device?",
      version: "App version",
      checkUpd: "Check for updates",
      updTitle: "A new version is available 🎉",
      updAvail: (v) => `Version ${v} has been released.`,
      updDl: "Download update",
      later: "Later",
      upToDate: "You're on the latest version ✅",
      getApp: "Android & Windows apps",
      feat: "Made with ❤️ for music lovers"
    }
  };
  let lang = NATIVE ? localStorage.getItem("sc_lang") || "fa" : (((_c = (_b = tg == null ? void 0 : tg.initDataUnsafe) == null ? void 0 : _b.user) == null ? void 0 : _c.language_code) || "fa").startsWith("fa") ? "fa" : "en";
  const L = (k, ...a) => {
    var _a2, _b2;
    const v = (_b2 = (_a2 = STR[lang][k]) != null ? _a2 : STR.en[k]) != null ? _b2 : k;
    return typeof v === "function" ? v(...a) : v;
  };
  const P = {
    home: "M12 3 2 11h3v9h6v-6h2v6h6v-9h3z",
    search: "M10 2a8 8 0 0 1 6.32 12.9l5.39 5.4-1.41 1.4-5.4-5.39A8 8 0 1 1 10 2m0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12",
    lib: "M4 6h2v14H4zm4-2h2v16H8zm5.5.3 1.9-.6 5.1 15.3-1.9.6z",
    cog: "M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7m8.4 4.5.1-1-.1-1 2-1.6-2-3.4-2.4 1a7 7 0 0 0-1.7-1l-.4-2.6h-4l-.3 2.5a7 7 0 0 0-1.8 1l-2.4-1-2 3.5 2 1.5-.1 1 .1 1-2 1.6 2 3.4 2.4-1q.8.6 1.8 1l.3 2.6h4l.4-2.6q1-.4 1.7-1l2.4 1 2-3.4z",
    play: "M8 5.14v13.72L19 12z",
    pause: "M6 5h4v14H6zm8 0h4v14h-4z",
    next: "M6 6v12l8.5-6zm9 0h2.5v12H15z",
    prev: "M18 6v12l-8.5-6zM6.5 6H9v12H6.5z",
    shuffle: "M14.83 13.41 13.42 14.82l3.13 3.13L14.5 20H20v-5.5l-2.04 2.04zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4zm-3.92 5.17L5.41 4 4 5.41l5.17 5.17z",
    repeat: "M7 7h10v3l4-4-4-4v3H5v6h2zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2z",
    repeat1: "M7 7h10v3l4-4-4-4v3H5v6h2zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2zm-4-2V9h-1l-2 1v1h1.5v4z",
    heart: "M12 21.35 10.55 20C5.4 15.36 2 12.27 2 8.5 2 5.41 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.41 22 8.5c0 3.77-3.4 6.86-8.55 11.53z",
    heartO: "M16.5 3c-1.74 0-3.41.81-4.5 2.08C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.41 2 8.5c0 3.77 3.4 6.86 8.55 11.53L12 21.35l1.45-1.32C18.6 15.36 22 12.27 22 8.5 22 5.41 19.58 3 16.5 3m-4.4 15.55-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05",
    plus: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z",
    more: "M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4m0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4m0 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4",
    send: "M2 21 23 12 2 3v7l15 2-15 2z",
    down: "M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z",
    chevD: "M5 19h14v2H5zm7-2-6-6h4V3h4v8h4z",
    share: "M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11A2.99 2.99 0 0 0 21 5a3 3 0 1 0-5.91.7L8.04 9.81A3 3 0 1 0 6 15c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65A2.92 2.92 0 1 0 18 16.08",
    trash: "M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6zM19 4h-3.5l-1-1h-5l-1 1H5v2h14z",
    editI: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75z",
    queue: "M3 6h12v2H3zm0 4h12v2H3zm0 4h8v2H3zm14 0v-4h2v4h3v2h-3v4h-2v-4h-3v-2z",
    user: "M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10m0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5",
    link: "M3.9 12a3.1 3.1 0 0 1 3.1-3.1h4V7H7a5 5 0 0 0 0 10h4v-1.9H7A3.1 3.1 0 0 1 3.9 12M8 13h8v-2H8zm9-6h-4v1.9h4a3.1 3.1 0 0 1 0 6.2h-4V17h4a5 5 0 0 0 0-10",
    wave: "M3 10h2v4H3zm4-3h2v10H7zm4-4h2v18h-2zm4 5h2v8h-2zm4 2h2v4h-2z",
    music: "M12 3v10.55A4 4 0 1 0 14 17V7h4V3z",
    lock: "M12 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4m6-9h-1V6a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2M8.9 6a3.1 3.1 0 0 1 6.2 0v2H8.9z",
    up: "M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z",
    close: "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
    globe: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m6.93 6h-2.95a15.6 15.6 0 0 0-1.38-3.56A8 8 0 0 1 18.93 8M12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96M4.26 14a8 8 0 0 1 0-4h3.38a16.5 16.5 0 0 0 0 4zm.81 2h2.95c.32 1.25.78 2.45 1.38 3.56A8 8 0 0 1 5.07 16m2.95-8H5.07a8 8 0 0 1 4.33-3.56A15.6 15.6 0 0 0 8.02 8M12 19.96A14 14 0 0 1 10.09 16h3.82A14 14 0 0 1 12 19.96M14.34 14H9.66a14.7 14.7 0 0 1 0-4h4.68a14.7 14.7 0 0 1 0 4m.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8 8 0 0 1-4.33 3.56M16.36 14a16.5 16.5 0 0 0 0-4h3.38a8 8 0 0 1 0 4z",
    hq: "M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2m-8 12H9.5v-2h-2v2H6V9h1.5v2.5h2V9H11zm7-1a1 1 0 0 1-1 1h-.75v1.5h-1.5V15H14a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1zm-3.5-.5h2v-3h-2z",
    moon: "M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.39 5.39 0 0 1-4.4 2.26 5.4 5.4 0 0 1-3.14-9.8A9 9 0 0 0 12 3",
    bot: "M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1v3h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2v-3h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 12 2M7.5 13a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m9 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3",
    import: "M5 20h14v-2H5zM19 9h-4V3H9v6H5l7 7z"
  };
  Object.assign(P, {
    download: "M19 9h-4V3H9v6H5l7 7zM5 18v2h14v-2z",
    logout: "M10.09 15.59 11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67zM19 3H5a2 2 0 0 0-2 2v4h2V5h14v14H5v-4H3v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2",
    android: "M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85a.64.64 0 0 0-.83.22l-1.88 3.24a11.4 11.4 0 0 0-8.94 0L5.65 5.67a.64.64 0 0 0-.87-.2c-.28.18-.37.54-.22.83L6.4 9.48A10.8 10.8 0 0 0 1 18h22a10.8 10.8 0 0 0-5.4-8.52M7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5m10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5",
    windows: "M3 5.5l7.5-1v7H3zm0 13l7.5 1v-7H3zm8.5-14.1L21 3v8.5h-9.5zm0 15.2L21 21v-8.5h-9.5z",
    info: "M11 7h2v2h-2zm0 4h2v6h-2zm1-9a10 10 0 1 0 0 20 10 10 0 0 0 0-20",
    tg: "M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"
  });
  const I = (n, cls = "") => `<svg viewBox="0 0 24 24" class="${cls}"><path d="${P[n]}"/></svg>`;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s != null ? s : "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const fmtDur = (ms) => {
    const s = Math.round((ms || 0) / 1e3), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
    return h ? `${h}:${String(m).padStart(2, "0")}:${String(x).padStart(2, "0")}` : `${m}:${String(x).padStart(2, "0")}`;
  };
  const fmtNum = (n) => n >= 1e9 ? (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B" : n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M" : n >= 1e3 ? (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K" : String(n || 0);
  const art = (u, size = "t300x300") => u ? u.replace(/-(large|t\d+x\d+|crop|original)\./, `-${size}.`) : "";
  const haptic = (t = "light") => {
    var _a2;
    try {
      (_a2 = tg == null ? void 0 : tg.HapticFeedback) == null ? void 0 : _a2.impactOccurred(t);
    } catch (e) {
    }
  };
  const hapticOk = () => {
    var _a2;
    try {
      (_a2 = tg == null ? void 0 : tg.HapticFeedback) == null ? void 0 : _a2.notificationOccurred("success");
    } catch (e) {
    }
  };
  const PH = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5500"/><stop offset="1" stop-color="#ff2d6f"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/><path fill="rgba(255,255,255,.85)" d="M50 25v28a11 11 0 1 0 6 10V37h12V25z"/></svg>')}`;
  const img = (u, size) => `<img loading="lazy" src="${esc(art(u, size) || PH)}" onerror="this.src='${PH}'">`;
  async function api(path, opt = {}) {
    const r = await fetch(API + path, {
      method: opt.method || "GET",
      headers: Object.assign({ "Content-Type": "application/json" }, initData ? { "x-init-data": initData } : appToken ? { "x-app-token": appToken } : {}),
      body: opt.body ? JSON.stringify(opt.body) : void 0
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      if (r.status === 401 && NATIVE && appToken && !path.startsWith("/auth")) setTimeout(signedOut, 0);
      const e = new Error(j.error || String(r.status));
      e.status = r.status;
      throw e;
    }
    return j;
  }
  let toastT;
  function toast(msg) {
    let el = $(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.remove("show"), 2300);
  }
  const S = {
    me: null,
    bot: null,
    tab: "home",
    stack: [],
    tracks: /* @__PURE__ */ new Map(),
    favs: /* @__PURE__ */ new Set(),
    favId: null,
    playlists: [],
    queue: [],
    qi: -1,
    shuffle: false,
    repeat: "off",
    loadingTrack: false,
    search: { q: "", type: "tracks", items: [], offset: 0, more: false, loading: false },
    genre: "all",
    home: null,
    theme: localStorage.getItem("sc_theme") || "auto"
  };
  const remember = (arr) => {
    for (const t of arr || []) if (t == null ? void 0 : t.id) S.tracks.set(t.id, { ...S.tracks.get(t.id) || {}, ...t });
    return arr;
  };
  const view = () => S.stack[S.stack.length - 1];
  function go(v) {
    S.stack.push(v);
    render();
    window.scrollTo(0, 0);
    syncBack();
  }
  function back() {
    if ($(".sheet.show")) return closeSheet();
    if ($(".fp.show")) return closePlayer();
    if (S.stack.length > 1) {
      S.stack.pop();
      render();
      syncBack();
    }
  }
  function setTab(t) {
    S.tab = t;
    S.stack = [{ type: t }];
    render();
    window.scrollTo(0, 0);
    syncBack();
    haptic("soft");
  }
  function syncBack() {
    if (!(tg == null ? void 0 : tg.BackButton)) return;
    const show = S.stack.length > 1 || $(".fp.show") || $(".sheet.show");
    show ? tg.BackButton.show() : tg.BackButton.hide();
  }
  const root = () => $("#view");
  function render() {
    const v = view();
    document.querySelectorAll(".nav button").forEach((b) => b.classList.toggle("on", b.dataset.tab === S.tab));
    const r = { home: vHome, search: vSearch, library: vLibrary, settings: vSettings, playlist: vPlaylist, artist: vArtist, set: vSet, shared: vShared }[v.type];
    r(v);
  }
  function trackRow(t, i, opts = {}) {
    var _a2;
    const cur = ((_a2 = S.queue[S.qi]) == null ? void 0 : _a2.id) === t.id;
    const lock = t.drm || t.snipped;
    return `<div class="tr ${cur ? "cur" : ""} ${lock ? "drm" : ""}" data-act="play" data-id="${t.id}" data-ctx="${opts.ctx || ""}" data-i="${i}">
    ${opts.num ? `<div class="num">${i + 1}</div>` : ""}
    <div class="art">${img(t.artwork_url, "t120x120")}${cur ? `<div class="eqi"><i></i><i></i><i></i></div>` : ""}</div>
    <div class="meta"><div class="t" dir="auto">${esc(t.title)}</div>
      <div class="a" dir="auto">${lock ? `<span class="lock">${I("lock")}</span>` : ""}${esc(t.artist)} · ${fmtDur(t.duration_ms)}${t.playback_count ? ` · ▶ ${fmtNum(t.playback_count)}` : ""}</div></div>
    ${opts.edit ? `<div class="edit-btns"><button data-act="mvup" data-id="${t.id}">${I("up")}</button><button data-act="mvdn" data-id="${t.id}">${I("down")}</button><button class="del" data-act="rmpl" data-id="${t.id}">${I("close")}</button></div>` : `<button class="more" data-act="menu" data-id="${t.id}" data-ctx="${opts.ctx || ""}">${I("more")}</button>`}
  </div>`;
  }
  const trackList = (arr, opts = {}) => `<div class="list">${arr.map((t, i) => trackRow(t, i, opts)).join("")}</div>`;
  const skel = (n = 6) => `<div>${Array.from({ length: n }, () => `<div class="skrow"><div class="sk" style="width:52px;height:52px"></div><div style="flex:1"><div class="sk" style="height:13px;width:70%"></div><div class="sk" style="height:11px;width:40%;margin-top:8px"></div></div></div>`).join("")}</div>`;
  const emptyBox = (icon, h, p = "") => `<div class="empty"><div class="ico">${I(icon)}</div><h3>${esc(h)}</h3><div>${esc(p)}</div></div>`;
  const hCard = (t, ctx, i) => `<div class="hc" data-act="play" data-id="${t.id}" data-ctx="${ctx}" data-i="${i}"><div class="art">${img(t.artwork_url, "t300x300")}<div class="pp">${I("play")}</div></div><div class="t">${esc(t.title)}</div><div class="a">${esc(t.artist)}</div></div>`;
  const CTX = {};
  const setCtx = (key, arr) => {
    CTX[key] = arr;
    return key;
  };
  const visName = (n) => String(n || "").replace(/[\u115f\u1160\u3164\uffa0\u200b-\u200f\u2060\s]/g, "");
  async function vHome() {
    var _a2, _b2, _c2, _d, _e, _f, _g;
    const u = (_a2 = S.me) == null ? void 0 : _a2.user;
    const rawName = (u == null ? void 0 : u.first_name) || ((_c2 = (_b2 = tg == null ? void 0 : tg.initDataUnsafe) == null ? void 0 : _b2.user) == null ? void 0 : _c2.first_name) || "";
    const name = visName(rawName) ? rawName : (u == null ? void 0 : u.username) || "";
    const genres = ["all", "persian", "hiphop", "pop", "electronic", "rnb", "house", "lofi", "chill", "rock", "trap", "remix", "jazz", "classical"];
    root().innerHTML = `<div class="view">
    <div class="hdr"><div class="av">${(u == null ? void 0 : u.photo_url) ? `<img src="${esc(u.photo_url)}">` : esc((name[0] || "♪").toUpperCase())}</div>
      <div><h1>${L("hello")} ${esc(name)} 👋</h1><p>${L("welcome")}</p></div></div>
    <div class="hero"><h3>🎧 SoundCloud</h3><p>${lang === "fa" ? "میلیون‌ها آهنگ، پخش آنلاین و ارسال مستقیم فایل به تلگرام" : "Millions of tracks — stream & send straight to Telegram"}</p>
      <button class="bigbtn" data-act="tab" data-tab="search">${I("search")} ${L("search")}</button>${I("wave", "wave")}</div>
    <div id="recentBox"></div>
    <div class="h2"><h2>📈 ${L("trending")}</h2></div>
    <div class="seg" id="genres">${genres.map((g) => `<button class="chip ${S.genre === g ? "on" : ""}" data-act="genre" data-g="${g}">${g === "all" ? L("all") : "#" + g}</button>`).join("")}</div>
    <div id="trend" style="margin-top:10px">${skel(6)}</div>
    <div id="topBox"></div>
    <div class="foot">🎧 @${esc(((_d = S.bot) == null ? void 0 : _d.username) || "")}</div>
  </div>`;
    loadTrending();
    try {
      const h = S.home || (S.home = await api("/home"));
      remember(h.top);
      remember(h.recent);
      if (((_e = view()) == null ? void 0 : _e.type) !== "home") return;
      if ((_f = h.recent) == null ? void 0 : _f.length) $("#recentBox").innerHTML = `<div class="h2"><h2>🕘 ${L("recent")}</h2></div><div class="hs">${h.recent.map((t, i) => hCard(t, setCtx("recent", h.recent), i)).join("")}</div>`;
      if ((_g = h.top) == null ? void 0 : _g.length) $("#topBox").innerHTML = `<div class="h2"><h2>🔥 ${L("top")}</h2></div>${trackList(h.top.slice(0, 10), { ctx: setCtx("top", h.top), num: true })}`;
    } catch (e) {
    }
  }
  async function loadTrending() {
    var _a2;
    const box = $("#trend");
    if (!box) return;
    box.innerHTML = skel(6);
    try {
      const r = await api(`/trending?genre=${S.genre}`);
      remember(r.items);
      if (((_a2 = view()) == null ? void 0 : _a2.type) === "home" && $("#trend")) $("#trend").innerHTML = trackList(r.items, { ctx: setCtx("trend", r.items), num: true });
    } catch (e) {
      box.innerHTML = emptyBox("wave", L("err"));
    }
  }
  function vSearch() {
    const s = S.search;
    root().innerHTML = `<div class="view">
    <div class="sbox"><div class="sinput">${I("search")}<input id="q" type="search" enterkeyhint="search" autocomplete="off" placeholder="${esc(L("searchPh"))}" value="${esc(s.q)}"></div>
      <div class="seg">${["tracks", "users", "playlists"].map((k) => `<button class="chip ${s.type === k ? "on" : ""}" data-act="stype" data-k="${k}">${L(k === "users" ? "artists" : k === "playlists" ? "albums" : "tracks")}</button>`).join("")}</div></div>
    <div id="sres"></div><div id="smore"></div></div>`;
    const inp = $("#q");
    let deb;
    inp.addEventListener("input", () => {
      clearTimeout(deb);
      deb = setTimeout(() => doSearch(inp.value), 450);
    });
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        clearTimeout(deb);
        inp.blur();
        doSearch(inp.value, true);
      }
    });
    if (!s.q) setTimeout(() => inp.focus(), 250);
    drawSearch();
  }
  function drawSearch() {
    const s = S.search, box = $("#sres");
    if (!box) return;
    if (s.loading && !s.items.length) {
      box.innerHTML = skel(8);
      return;
    }
    if (!s.q) {
      box.innerHTML = emptyBox("search", L("startSearch"), L("startSearchSub"));
      return;
    }
    if (!s.items.length) {
      box.innerHTML = emptyBox("music", L("noRes"), L("tryElse"));
      return;
    }
    if (s.type === "tracks") box.innerHTML = trackList(s.items, { ctx: setCtx("search", s.items) });
    else if (s.type === "users") box.innerHTML = `<div class="list">${s.items.map((u) => `<div class="tr ur" data-act="artist" data-id="${u.id}"><div class="art">${img(u.avatar_url, "t120x120")}</div><div class="meta"><div class="t">${esc(u.username)} ${u.verified ? "✅" : ""}</div><div class="a">👥 ${fmtNum(u.followers)} · 🎵 ${u.tracks}${u.city ? " · " + esc(u.city) : ""}</div></div></div>`).join("")}</div>`;
    else box.innerHTML = `<div class="list">${s.items.map((p) => `<div class="tr" data-act="set" data-id="${p.id}"><div class="art">${img(p.artwork_url, "t120x120")}</div><div class="meta"><div class="t">${esc(p.title)}</div><div class="a"><span class="badge">${p.is_album ? L("album") : L("playlist")}</span> ${esc(p.username)} · ${p.track_count} 🎵</div></div></div>`).join("")}</div>`;
    $("#smore").innerHTML = s.more ? `<div class="spin" id="sentinel"></div>` : "";
    const sen = $("#sentinel");
    if (sen) new IntersectionObserver((en, ob) => {
      if (en[0].isIntersecting) {
        ob.disconnect();
        doSearch(s.q, false, true);
      }
    }).observe(sen);
  }
  let searchSeq = 0;
  async function doSearch(q, force = false, more = false) {
    const s = S.search;
    q = (q || "").trim();
    if (!more && q === s.q && !force && s.items.length) return;
    if (/soundcloud\.com|snd\.sc/i.test(q)) return openLink(q);
    const seq = ++searchSeq;
    if (!more) {
      s.q = q;
      s.items = [];
      s.offset = 0;
      s.more = false;
    }
    if (!q) return drawSearch();
    s.loading = true;
    drawSearch();
    try {
      const r = await api(`/search?type=${s.type}&q=${encodeURIComponent(q)}&offset=${s.offset}`);
      if (seq !== searchSeq) return;
      const items = r.items || [];
      if (s.type === "tracks") remember(items);
      s.items = more ? s.items.concat(items) : items;
      s.offset += items.length;
      s.more = items.length >= 20 && s.offset < 200;
    } catch (e) {
      toast(L("err"));
    }
    s.loading = false;
    drawSearch();
  }
  async function openLink(url) {
    try {
      const r = await api(`/resolve?url=${encodeURIComponent(url)}`);
      if (r.kind === "track") {
        const d = await api(`/track/${r.id}`);
        remember([d.track]);
        playList([d.track], 0);
      } else if (r.kind === "playlist") go({ type: "set", id: r.id });
      else if (r.kind === "user") go({ type: "artist", id: r.id });
    } catch (e) {
      toast(L("noRes"));
    }
  }
  async function loadPlaylists() {
    const r = await api("/playlists");
    S.playlists = r.items || [];
    const f = S.playlists.find((p) => p.is_favorites);
    if (f) S.favId = f.id;
    return S.playlists;
  }
  async function vLibrary() {
    var _a2;
    root().innerHTML = `<div class="view"><div class="hdr"><div class="logo">📂 <b>${L("library")}</b></div></div><div id="pls"><div class="spin"></div></div></div>`;
    try {
      await loadPlaylists();
    } catch (e) {
      $("#pls").innerHTML = emptyBox("lib", L("err"));
      return;
    }
    if (((_a2 = view()) == null ? void 0 : _a2.type) !== "library") return;
    const cards = S.playlists.map((p) => `<button class="pc" data-act="pl" data-id="${p.id}">
      <div class="cv ${p.is_favorites ? "fav" : ""}">${p.is_favorites ? I("heart") : p.cover ? img(p.cover, "t300x300") : I("music")}</div>
      <div class="n">${esc(p.is_favorites ? L("favorites") : p.name)}</div><div class="c">${L("tracksN", p.track_count)}${!p.is_favorites ? ` · ${p.is_public ? "🌐" : "🔒"}` : ""}</div></button>`).join("");
    $("#pls").innerHTML = `<div class="grid">${cards}
    <button class="pc" data-act="newpl"><div class="cv new">${I("plus")}</div><div class="n">${L("newPl")}</div><div class="c">&nbsp;</div></button>
    <button class="pc" data-act="importpl"><div class="cv new">${I("import")}</div><div class="n">${L("importPl")}</div><div class="c">SoundCloud</div></button></div>`;
  }
  async function vPlaylist(v) {
    var _a2;
    root().innerHTML = `<div class="view"><div class="spin"></div></div>`;
    let d;
    try {
      d = await api(`/playlists/${v.id}`);
    } catch (e) {
      root().innerHTML = `<div class="view">${emptyBox("lib", L("err"))}</div>`;
      return;
    }
    if (view() !== v) return;
    v.data = d;
    remember(d.tracks);
    const p = d.playlist, tr = d.tracks;
    const total = tr.reduce((a, x) => a + (x.duration_ms || 0), 0);
    const cover = (_a2 = tr.find((x) => x.artwork_url)) == null ? void 0 : _a2.artwork_url;
    const name = p.is_favorites ? L("favorites") : p.name;
    root().innerHTML = `<div class="view">
    <div class="ph"><div class="bgimg" style="background-image:url('${esc(art(cover, "t300x300") || PH)}')"></div>
      <div class="in"><div class="cover ${p.is_favorites ? "fav" : ""}">${p.is_favorites ? I("heart") : img(cover, "t300x300")}</div>
      <div class="info"><div class="kind">${L("playlist")} ${!p.is_favorites ? p.is_public ? "· 🌐" : "· 🔒" : ""}</div><h1>${esc(name)}</h1><div class="sub">${L("tracksN", tr.length)} · ${fmtDur(total)}</div></div></div></div>
    ${tr.length ? `<div class="acts">
      <button class="btn pri" data-act="plplay">${I("play")} ${L("play")}</button>
      <button class="btn ic" data-act="plshuffle">${I("shuffle")}</button>
      <button class="btn ic" data-act="plsend" title="${esc(L("sendAll"))}">${I("send")}</button>
      ${!p.is_favorites ? `<button class="btn ic" data-act="plshare">${I("share")}</button>` : ""}
      <button class="btn ic" data-act="plmenu">${I("more")}</button></div>` : !p.is_favorites ? `<div class="acts"><button class="btn" data-act="plmenu">${I("more")}</button></div>` : ""}
    ${tr.length ? trackList(tr, { ctx: setCtx("pl:" + p.id, tr), edit: v.edit, num: !v.edit }) : emptyBox("music", L("emptyPl"), L("emptyPlSub"))}
    ${v.edit ? `<div class="acts"><button class="btn pri" style="flex:1" data-act="pldone">✓ ${L("done")}</button></div>` : ""}
  </div>`;
  }
  async function vShared(v) {
    var _a2;
    root().innerHTML = `<div class="view"><div class="spin"></div></div>`;
    let d;
    try {
      d = await api(`/shared/${v.code}`);
    } catch (e) {
      root().innerHTML = `<div class="view">${emptyBox("lib", L("noRes"))}</div>`;
      return;
    }
    if (view() !== v) return;
    remember(d.tracks);
    const cover = (_a2 = d.tracks.find((x) => x.artwork_url)) == null ? void 0 : _a2.artwork_url;
    root().innerHTML = `<div class="view">
    <div class="ph"><div class="bgimg" style="background-image:url('${esc(art(cover) || PH)}')"></div>
      <div class="in"><div class="cover">${img(cover, "t300x300")}</div>
      <div class="info"><div class="kind">${L("sharedBy")}</div><h1>${esc(d.playlist.name)}</h1><div class="sub">${L("tracksN", d.tracks.length)}</div></div></div></div>
    <div class="acts"><button class="btn pri" data-act="ctxplay" data-ctx="shared">${I("play")} ${L("play")}</button>
      ${!d.playlist.own ? `<button class="btn" data-act="copyshared" data-code="${esc(v.code)}">${I("plus")} ${L("copyToMine")}</button>` : ""}</div>
    ${trackList(d.tracks, { ctx: setCtx("shared", d.tracks), num: true })}</div>`;
  }
  async function vArtist(v) {
    root().innerHTML = `<div class="view"><div class="spin"></div></div>`;
    if (!v.data) {
      try {
        v.data = await api(`/user/${v.id}`);
      } catch (e) {
        root().innerHTML = `<div class="view">${emptyBox("user", L("err"))}</div>`;
        return;
      }
    }
    if (view() !== v) return;
    const { user: u, top, latest } = v.data;
    remember(top);
    remember(latest);
    v.mode = v.mode || "top";
    const list = v.mode === "top" ? top : latest;
    root().innerHTML = `<div class="view">
    <div class="ph"><div class="bgimg" style="background-image:url('${esc(art(u.avatar_url) || PH)}')"></div>
      <div class="in"><div class="cover round">${img(u.avatar_url, "t300x300")}</div>
      <div class="info"><div class="kind">${L("artist")} ${u.verified ? "✅" : ""}</div><h1>${esc(u.username)}</h1><div class="sub">👥 ${fmtNum(u.followers)} ${L("followers")} · 🎵 ${u.tracks}</div></div></div></div>
    <div class="acts"><button class="btn pri" data-act="ctxplay" data-ctx="artist">${I("play")} ${L("play")}</button>
      <button class="btn ic" data-act="ctxshuffle" data-ctx="artist">${I("shuffle")}</button>
      <a class="btn ic" href="${esc(u.permalink_url)}" target="_blank">${I("link")}</a></div>
    <div class="seg" style="margin-bottom:8px"><button class="chip ${v.mode === "top" ? "on" : ""}" data-act="amode" data-m="top">🔥 ${L("topTracks")}</button><button class="chip ${v.mode === "new" ? "on" : ""}" data-act="amode" data-m="new">🆕 ${L("latest")}</button></div>
    ${list.length ? trackList(list, { ctx: setCtx("artist", list), num: true }) : emptyBox("music", L("noRes"))}</div>`;
  }
  async function vSet(v) {
    root().innerHTML = `<div class="view"><div class="spin"></div></div>`;
    if (!v.data) {
      try {
        v.data = await api(`/set/${v.id}`);
      } catch (e) {
        root().innerHTML = `<div class="view">${emptyBox("lib", L("err"))}</div>`;
        return;
      }
    }
    if (view() !== v) return;
    const { set, tracks } = v.data;
    remember(tracks);
    const total = tracks.reduce((a, x) => a + (x.duration_ms || 0), 0);
    root().innerHTML = `<div class="view">
    <div class="ph"><div class="bgimg" style="background-image:url('${esc(art(set.artwork_url) || PH)}')"></div>
      <div class="in"><div class="cover">${img(set.artwork_url, "t300x300")}</div>
      <div class="info"><div class="kind">${set.is_album ? L("album") : L("playlist")}</div><h1>${esc(set.title)}</h1><div class="sub">${esc(set.username)} · ${L("tracksN", tracks.length)} · ${fmtDur(total)}</div></div></div></div>
    <div class="acts"><button class="btn pri" data-act="ctxplay" data-ctx="set">${I("play")} ${L("play")}</button>
      <button class="btn ic" data-act="ctxshuffle" data-ctx="set">${I("shuffle")}</button>
      ${set.id ? `<button class="btn" data-act="saveset" data-id="${set.id}">${I("plus")} ${L("saveAsPl")}</button>` : ""}</div>
    ${trackList(tracks, { ctx: setCtx("set", tracks), num: true })}</div>`;
  }
  function vSettings() {
    var _a2, _b2, _c2, _d, _e;
    const u0 = ((_a2 = S.me) == null ? void 0 : _a2.user) || {};
    const u = Object.assign({}, u0, { first_name: visName(u0.first_name) ? u0.first_name : u0.username || "" });
    root().innerHTML = `<div class="view">
    <div class="hdr"><div class="av">${u.photo_url ? `<img src="${esc(u.photo_url)}">` : esc((u.first_name || "♪")[0])}</div><div><h1>${esc(u.first_name || "")}</h1><p>${u.username ? "@" + esc(u.username) : ""}</p></div></div>
    <div class="stats"><div><b>${(_b2 = u.downloads) != null ? _b2 : 0}</b><span>${L("downloads")}</span></div><div><b>${Math.max(0, S.playlists.filter((p) => !p.is_favorites).length)}</b><span>${L("playlists")}</span></div><div><b>${S.favs.size || ((_d = (_c2 = S.playlists.find((p) => p.is_favorites)) == null ? void 0 : _c2.track_count) != null ? _d : 0)}</b><span>${L("favorites")}</span></div></div>
    <div class="card">
      <button class="it" data-act="setlang"><div class="ico" style="background:#4c7dff">${I("globe")}</div><div class="l">${L("lang")}</div><div class="v">${lang === "fa" ? "فارسی 🇮🇷" : "English 🇬🇧"}</div></button>
      <button class="it" data-act="setq"><div class="ico" style="background:#ff8a00">${I("hq")}</div><div class="l">${L("quality")}</div><div class="v">${u.quality === "low" ? L("qLow") : L("qHigh")}</div></button>
      <button class="it" data-act="settheme"><div class="ico" style="background:#8b5cf6">${I("moon")}</div><div class="l">${L("theme")}</div><div class="v">${L(S.theme)}</div></button>
    </div>
    <div class="card"><button class="it" data-act="openbot"><div class="ico" style="background:#2aabee">${I("tg")}</div><div class="l">${L("openBot")}</div><div class="v">@${esc(((_e = S.bot) == null ? void 0 : _e.username) || "")}</div></button>
      ${NATIVE ? "" : `<button class="it" data-act="getapp"><div class="ico" style="background:#22c55e">${I("download")}</div><div class="l">${L("getApp")}</div><div class="v">${I("android", "mini-ic")} ${I("windows", "mini-ic")}</div></button>`}</div>
    ${NATIVE ? `<div class="card">
      <button class="it" data-act="checkupd"><div class="ico" style="background:#0ea5e9">${I(NATIVE.platform === "android" ? "android" : "windows")}</div><div class="l">${L("version")}</div><div class="v">${S.update ? `<span class="badge">${esc(S.update.v)}</span> ` : ""}v${esc(NATIVE.version)}</div></button>
      <button class="it" data-act="logout"><div class="ico" style="background:#ef4444">${I("logout")}</div><div class="l">${L("logout")}</div><div class="v"></div></button></div>` : ""}
    <div class="foot">🎧 SoundCloud ${NATIVE ? `Player v${esc(NATIVE.version)}` : "Mini App"}<br>${L("feat")}</div></div>`;
  }
  function openSheet(html) {
    let ov = $(".ov"), sh = $(".sheet");
    if (!ov) {
      ov = document.createElement("div");
      ov.className = "ov";
      ov.onclick = closeSheet;
      document.body.appendChild(ov);
    }
    if (!sh) {
      sh = document.createElement("div");
      sh.className = "sheet";
      document.body.appendChild(sh);
      sh.addEventListener("click", onClick);
    }
    sh.innerHTML = `<div class="grab"></div>${html}`;
    requestAnimationFrame(() => {
      ov.classList.add("show");
      sh.classList.add("show");
      syncBack();
    });
  }
  function closeSheet() {
    var _a2, _b2;
    (_a2 = $(".ov")) == null ? void 0 : _a2.classList.remove("show");
    (_b2 = $(".sheet")) == null ? void 0 : _b2.classList.remove("show");
    setTimeout(syncBack, 50);
  }
  function trackMenu(id, ctx) {
    const t = S.tracks.get(Number(id));
    if (!t) return;
    const fav = S.favs.has(t.id);
    const inPl = (ctx == null ? void 0 : ctx.startsWith("pl:")) ? ctx.slice(3) : null;
    openSheet(`<div class="sh"><div class="art">${img(t.artwork_url, "t120x120")}</div><div><div class="t">${esc(t.title)}</div><div class="a">${esc(t.artist)} · ${fmtDur(t.duration_ms)}</div></div></div>
    <button class="mi" data-act="m_next" data-id="${t.id}">${I("play")} ${L("playNext")}</button>
    <button class="mi" data-act="m_queue" data-id="${t.id}">${I("queue")} ${L("addQueue")}</button>
    <button class="mi" data-act="m_addpl" data-id="${t.id}">${I("plus")} ${L("addPl")}</button>
    <button class="mi" data-act="m_fav" data-id="${t.id}">${I(fav ? "heart" : "heartO")} ${fav ? L("unfav") : L("fav")}</button>
    <button class="mi" data-act="m_send" data-id="${t.id}">${I("send")} ${L("sendChat")}</button>
    <button class="mi" data-act="m_similar" data-id="${t.id}">${I("wave")} ${L("similar")}</button>
    ${t.user_id ? `<button class="mi" data-act="m_artist" data-id="${t.user_id}">${I("user")} ${L("goArtist")}</button>` : ""}
    ${t.permalink_url ? `<button class="mi" data-act="m_open" data-url="${esc(t.permalink_url)}">${I("link")} ${L("openSc")}</button>` : ""}
    ${inPl ? `<button class="mi red" data-act="m_rmpl" data-id="${t.id}" data-pl="${inPl}">${I("trash")} ${L("removeFromPl")}</button>` : ""}`);
  }
  async function addToPlSheet(id) {
    if (!S.playlists.length) {
      try {
        await loadPlaylists();
      } catch (e) {
      }
    }
    const pls = S.playlists.filter((p) => !p.is_favorites);
    openSheet(`<h3>${L("addPl")}</h3>
    <button class="mi" data-act="newpl" data-track="${id}">${I("plus")} ${L("newPl")}</button>
    ${pls.map((p) => `<button class="mi" data-act="m_addto" data-pl="${p.id}" data-id="${id}">${I("music")} ${esc(p.name)} <span style="margin-inline-start:auto;color:var(--hint);font-size:13px">${p.track_count}</span></button>`).join("")}`);
  }
  function promptSheet(title, ph, okLabel, val, cb) {
    openSheet(`<h3>${esc(title)}</h3><div style="padding:0 6px"><input class="field" id="pin" placeholder="${esc(ph)}" value="${esc(val || "")}">
    <div class="row2"><button class="btn" data-act="closesheet">${L("cancel")}</button><button class="btn pri" id="pok">${esc(okLabel)}</button></div></div>`);
    const inp = $("#pin");
    setTimeout(() => inp.focus(), 300);
    const ok = () => {
      const v = inp.value.trim();
      if (v) {
        closeSheet();
        cb(v);
      }
    };
    $("#pok").onclick = ok;
    inp.onkeydown = (e) => {
      if (e.key === "Enter") ok();
    };
  }
  const audio = new Audio();
  audio.preload = "auto";
  let hls = null;
  function unlockAudio() {
    if (audio.src) return;
    audio.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=";
    audio.play().catch(() => {
    });
  }
  document.addEventListener("touchend", unlockAudio, { once: true });
  document.addEventListener("click", unlockAudio, { once: true });
  function playList(list, i) {
    const clean = list.filter((t) => !(t.drm || t.snipped));
    const target = list[i];
    if (target && (target.drm || target.snipped)) {
      toast(L("drm"));
      return;
    }
    S.queue = clean.slice();
    S.qi = Math.max(0, S.queue.findIndex((t) => t.id === (target == null ? void 0 : target.id)));
    if (S.shuffle) shuffleQueue(true);
    loadCurrent();
  }
  function shuffleQueue(keepCurrent) {
    const cur = S.queue[S.qi];
    const rest = S.queue.filter((_, k) => k !== S.qi);
    for (let k = rest.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [rest[k], rest[j]] = [rest[j], rest[k]];
    }
    S.queue = keepCurrent && cur ? [cur, ...rest] : rest;
    S.qi = 0;
  }
  let loadSeq = 0;
  async function loadCurrent(autoplay = true) {
    var _a2;
    const t = S.queue[S.qi];
    if (!t) return;
    const seq = ++loadSeq;
    S.loadingTrack = true;
    updatePlayerUI();
    highlightRows();
    try {
      const s = await api(`/stream/${t.id}`);
      if (seq !== loadSeq) return;
      if (s.track) {
        Object.assign(t, s.track);
        remember([s.track]);
      }
      if (hls) {
        hls.destroy();
        hls = null;
      }
      const isHls = /\.m3u8/i.test(s.url) || ((_a2 = s.kind) == null ? void 0 : _a2.startsWith("hls"));
      if (!isHls || audio.canPlayType("application/vnd.apple.mpegurl")) {
        audio.src = s.url;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({ enableWorker: true, maxBufferLength: 30 });
        hls.loadSource(s.url);
        hls.attachMedia(audio);
        hls.on(window.Hls.Events.ERROR, (_, d) => {
          if (d.fatal) {
            console.warn("hls fatal", d);
            next(true);
          }
        });
      } else {
        audio.src = s.url;
      }
      if (autoplay) await audio.play().catch((e) => console.warn("play blocked", e));
      setMediaSession(t);
      pushNative();
    } catch (e) {
      if (seq !== loadSeq) return;
      toast(e.status === 451 ? L("drm") : L("err"));
      if (S.queue.length > 1) setTimeout(() => next(true), 600);
    } finally {
      if (seq === loadSeq) {
        S.loadingTrack = false;
        updatePlayerUI();
      }
    }
  }
  function toggle() {
    if (!S.queue.length) return;
    audio.paused ? audio.play() : audio.pause();
    haptic();
  }
  function next(auto = false) {
    if (!S.queue.length) return;
    if (auto && S.repeat === "one") {
      audio.currentTime = 0;
      audio.play();
      return;
    }
    if (S.qi < S.queue.length - 1) S.qi++;
    else if (S.repeat === "all" || !auto) S.qi = 0;
    else {
      audio.pause();
      return;
    }
    loadCurrent();
  }
  function prev() {
    if (audio.currentTime > 4) {
      audio.currentTime = 0;
      return;
    }
    if (S.qi > 0) S.qi--;
    else S.qi = S.queue.length - 1;
    loadCurrent();
  }
  audio.addEventListener("ended", () => next(true));
  function pushNative() {
    if (!(NATIVE == null ? void 0 : NATIVE.mediaState)) return;
    const t = S.queue[S.qi];
    try {
      NATIVE.mediaState(JSON.stringify(t ? {
        id: t.id,
        title: t.title || "",
        artist: t.artist || "",
        artwork: art(t.artwork_url, "t500x500") || "",
        playing: !audio.paused,
        loading: !!S.loadingTrack,
        position: Math.floor((audio.currentTime || 0) * 1e3),
        duration: Math.floor((audio.duration && isFinite(audio.duration) ? audio.duration : (t.duration_ms || 0) / 1e3) * 1e3)
      } : { stop: true }));
    } catch (e) {
    }
  }
  ["play", "pause", "loadedmetadata", "seeked", "playing", "emptied"].forEach((ev) => audio.addEventListener(ev, pushNative));
  window.__scMedia = (cmd, arg) => {
    switch (cmd) {
      case "play":
        audio.play().catch(() => {
        });
        break;
      case "pause":
        audio.pause();
        break;
      case "toggle":
        toggle();
        break;
      case "next":
        next();
        break;
      case "prev":
        prev();
        break;
      case "seek":
        if (isFinite(arg)) audio.currentTime = Number(arg) / 1e3;
        break;
      case "stop":
        audio.pause();
        break;
    }
  };
  window.__scBack = () => {
    if (document.body.classList.contains("auth")) return false;
    if ($(".sheet.show") || $(".fp.show") || S.stack.length > 1) {
      back();
      return true;
    }
    if (S.tab !== "home") {
      setTab("home");
      return true;
    }
    return false;
  };
  audio.addEventListener("play", () => {
    updatePlayerUI();
    document.body.classList.remove("paused");
  });
  audio.addEventListener("pause", () => {
    updatePlayerUI();
    document.body.classList.add("paused");
  });
  audio.addEventListener("waiting", () => {
    var _a2;
    return (_a2 = $(".fp")) == null ? void 0 : _a2.classList.add("loading");
  });
  audio.addEventListener("playing", () => {
    var _a2;
    return (_a2 = $(".fp")) == null ? void 0 : _a2.classList.remove("loading");
  });
  audio.addEventListener("timeupdate", updateProgress);
  audio.addEventListener("loadedmetadata", updateProgress);
  function setMediaSession(t) {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: t.title,
      artist: t.artist,
      album: "SoundCloud",
      artwork: t.artwork_url ? [{ src: art(t.artwork_url, "t500x500"), sizes: "500x500", type: "image/jpeg" }] : []
    });
    const h = navigator.mediaSession.setActionHandler.bind(navigator.mediaSession);
    try {
      h("play", () => audio.play());
      h("pause", () => audio.pause());
      h("nexttrack", () => next());
      h("previoustrack", () => prev());
      h("seekto", (d) => {
        audio.currentTime = d.seekTime;
      });
    } catch (e) {
    }
  }
  function buildPlayer() {
    const mini = document.createElement("div");
    mini.className = "mini";
    mini.innerHTML = `<div class="art" data-act="openfp"><img src="${PH}"></div><div class="meta" data-act="openfp"><div class="t"></div><div class="a"></div></div>
    <button class="b" data-act="toggle" id="mpp">${I("play")}</button><button class="b" data-act="next">${I("next")}</button><div class="prog"><i></i></div>`;
    document.body.appendChild(mini);
    const fp = document.createElement("div");
    fp.className = "fp paused";
    fp.innerHTML = `<div class="bgimg"></div><div class="in">
    <div class="top"><button class="b" data-act="closefp">${I("down")}</button><div class="lbl">${L("nowPlaying").toUpperCase()}<div id="fpctx" dir="ltr" style="color:var(--text);font-size:13px;margin-top:2px;letter-spacing:0"></div></div><button class="b" data-act="fpmenu">${I("more")}</button></div>
    <div class="cover"><div class="img" style="position:relative"><img id="fpimg" src="${PH}"><div class="loading-ring"><div class="spin"></div></div></div></div>
    <div class="ti"><div class="m"><h2 id="fpt" dir="auto"></h2><p id="fpa" dir="auto"></p></div><button class="b" data-act="fpfav" id="fpfav">${I("heartO")}</button></div>
    <div class="seek"><input type="range" id="seek" min="0" max="1000" value="0"><div class="tm"><span id="tcur">0:00</span><span id="tdur">0:00</span></div></div>
    <div class="ctr"><button class="b sm" data-act="shuffle" id="bsh">${I("shuffle")}</button><button class="b" data-act="prev">${I("prev")}</button>
      <button class="b pl" data-act="toggle" id="fpp">${I("play")}</button><button class="b" data-act="next">${I("next")}</button>
      <button class="b sm" data-act="repeat" id="brp">${I("repeat")}</button></div>
    <div class="bar"><button data-act="fpsend">${I("send")}<span>${L("sendChat").split(" ").slice(0, 2).join(" ")}</span></button>
      <button data-act="fpaddpl">${I("plus")}<span>${L("addPl").split(" ")[0]}</span></button>
      <button data-act="showqueue">${I("queue")}<span>${L("queue")}</span></button>
      <button data-act="fpshare">${I("share")}<span>${L("share")}</span></button></div></div>`;
    document.body.appendChild(fp);
    fp.addEventListener("click", onClick);
    mini.addEventListener("click", onClick);
    const seek = $("#seek");
    let dragging = false;
    seek.addEventListener("input", () => {
      dragging = true;
      seek.style.setProperty("--p", seek.value / 10 + "%");
      $("#tcur").textContent = fmtDur(seek.value / 1e3 * (audio.duration || 0) * 1e3);
    });
    seek.addEventListener("change", () => {
      if (audio.duration) audio.currentTime = seek.value / 1e3 * audio.duration;
      dragging = false;
    });
    seek._drag = () => dragging;
    let sy = null;
    fp.addEventListener("touchstart", (e) => {
      if (e.target.closest(".seek")) return;
      sy = e.touches[0].clientY;
    }, { passive: true });
    fp.addEventListener("touchend", (e) => {
      if (sy !== null && e.changedTouches[0].clientY - sy > 110) closePlayer();
      sy = null;
    });
  }
  function openPlayer() {
    if (!S.queue.length) return;
    $(".fp").classList.add("show");
    syncBack();
    haptic();
  }
  function closePlayer() {
    $(".fp").classList.remove("show");
    setTimeout(syncBack, 50);
  }
  function updatePlayerUI() {
    const t = S.queue[S.qi];
    const mini = $(".mini"), fp = $(".fp");
    if (!mini) return;
    mini.classList.toggle("show", !!t);
    if (!t) return;
    const playing = !audio.paused;
    const ic = S.loadingTrack ? `<div class="spin" style="width:22px;height:22px;margin:0;border-width:3px"></div>` : I(playing ? "pause" : "play");
    $("#mpp").innerHTML = ic;
    $("#fpp").innerHTML = S.loadingTrack ? `<div class="spin" style="width:30px;height:30px;margin:0;border-color:rgba(255,255,255,.35);border-top-color:#fff"></div>` : I(playing ? "pause" : "play");
    const a = art(t.artwork_url, "t500x500") || PH;
    const mimg = $(".mini .art img");
    if (mimg.dataset.src !== a) {
      mimg.src = a;
      mimg.dataset.src = a;
    }
    $(".mini .t").textContent = t.title;
    $(".mini .a").textContent = t.artist;
    const fimg = $("#fpimg");
    if (fimg.dataset.src !== a) {
      fimg.src = a;
      fimg.dataset.src = a;
      $(".fp .bgimg").style.backgroundImage = `url('${a}')`;
    }
    $("#fpt").textContent = t.title;
    $("#fpa").textContent = t.artist;
    $("#fpctx").textContent = `${S.qi + 1} / ${S.queue.length}`;
    fp.classList.toggle("paused", !playing);
    fp.classList.toggle("loading", S.loadingTrack);
    const fav = S.favs.has(t.id);
    $("#fpfav").innerHTML = I(fav ? "heart" : "heartO");
    $("#fpfav").classList.toggle("on", fav);
    $("#bsh").classList.toggle("on", S.shuffle);
    $("#brp").classList.toggle("on", S.repeat !== "off");
    $("#brp").innerHTML = I(S.repeat === "one" ? "repeat1" : "repeat");
  }
  function updateProgress() {
    var _a2, _b2;
    const d = audio.duration || (((_a2 = S.queue[S.qi]) == null ? void 0 : _a2.duration_ms) || 0) / 1e3;
    const p = d ? audio.currentTime / d * 100 : 0;
    const bar = $(".mini .prog i");
    if (bar) bar.style.width = p + "%";
    const seek = $("#seek");
    if (seek && !((_b2 = seek._drag) == null ? void 0 : _b2.call(seek))) {
      seek.value = String(p * 10);
      seek.style.setProperty("--p", p + "%");
      $("#tcur").textContent = fmtDur(audio.currentTime * 1e3);
    }
    const td = $("#tdur");
    if (td) td.textContent = fmtDur(d * 1e3);
  }
  function highlightRows() {
    var _a2;
    const id = (_a2 = S.queue[S.qi]) == null ? void 0 : _a2.id;
    document.querySelectorAll("#view .tr[data-act=play]").forEach((el) => {
      const on = Number(el.dataset.id) === id;
      el.classList.toggle("cur", on);
      const a = el.querySelector(".art");
      const eq = a == null ? void 0 : a.querySelector(".eqi");
      if (on && !eq && a) a.insertAdjacentHTML("beforeend", `<div class="eqi"><i></i><i></i><i></i></div>`);
      if (!on && eq) eq.remove();
    });
  }
  function showQueue() {
    openSheet(`<div class="qhdr"><h3 style="margin:6px 0">${L("queue")} · ${S.queue.length}</h3></div>
    ${S.queue.length ? `<div class="list">${S.queue.map((t, i) => `<div class="tr ${i === S.qi ? "cur" : ""}" data-act="qjump" data-i="${i}"><div class="num">${i + 1}</div><div class="art">${img(t.artwork_url, "t120x120")}</div><div class="meta"><div class="t">${esc(t.title)}</div><div class="a">${esc(t.artist)} · ${fmtDur(t.duration_ms)}</div></div>${i !== S.qi ? `<button class="more" data-act="qrm" data-i="${i}">${I("close")}</button>` : ""}</div>`).join("")}</div>` : emptyBox("queue", L("queueEmpty"))}`);
  }
  async function toggleFav(id) {
    id = Number(id);
    try {
      const r = await api("/favorites", { method: "POST", body: { track_id: id } });
      r.favorite ? S.favs.add(id) : S.favs.delete(id);
      toast(r.favorite ? L("favOn") : L("favOff"));
      hapticOk();
      updatePlayerUI();
      S.playlists = [];
    } catch (e) {
      toast(L("err"));
    }
  }
  async function sendToChat(ids) {
    toast(L("sending"));
    try {
      await api("/send", { method: "POST", body: Array.isArray(ids) ? { track_ids: ids } : { track_id: ids } });
      toast(L("sent"));
      hapticOk();
    } catch (e) {
      toast(L("err"));
    }
  }
  async function shareLink(link, text) {
    const url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text || "")}`;
    openExt(url);
  }
  async function loadFavs() {
    try {
      if (!S.favId) await loadPlaylists();
      if (!S.favId) return;
      const d = await api(`/playlists/${S.favId}`);
      S.favs = new Set(d.tracks.map((t) => t.id));
      remember(d.tracks);
    } catch (e) {
    }
  }
  async function onClick(e) {
    var _a2, _b2, _c2, _d, _e, _f, _g, _h;
    const el = e.target.closest("[data-act]");
    if (!el) return;
    const a = el.dataset.act, id = el.dataset.id;
    if (a === "menu" || a === "mvup" || a === "mvdn" || a === "rmpl" || a === "qrm") e.stopPropagation();
    switch (a) {
      case "tab":
        return setTab(el.dataset.tab);
      case "play": {
        const ctx = el.dataset.ctx, list = CTX[ctx] || [S.tracks.get(Number(id))];
        haptic();
        return playList(list, Number((_a2 = el.dataset.i) != null ? _a2 : 0));
      }
      case "ctxplay": {
        const l = CTX[el.dataset.ctx] || [];
        S.shuffle = false;
        return playList(l, 0);
      }
      case "ctxshuffle": {
        const l = CTX[el.dataset.ctx] || [];
        S.shuffle = true;
        return playList(l, Math.floor(Math.random() * l.length));
      }
      case "menu":
        haptic();
        return trackMenu(id, el.dataset.ctx);
      case "genre":
        S.genre = el.dataset.g;
        document.querySelectorAll("#genres .chip").forEach((c) => c.classList.toggle("on", c.dataset.g === S.genre));
        haptic("soft");
        return loadTrending();
      case "stype":
        S.search.type = el.dataset.k;
        document.querySelectorAll(".sbox .chip").forEach((c) => c.classList.toggle("on", c.dataset.k === S.search.type));
        haptic("soft");
        return doSearch(S.search.q, true);
      case "artist":
      case "m_artist":
        closeSheet();
        closePlayer();
        return go({ type: "artist", id: Number(id) });
      case "set":
        return go({ type: "set", id: Number(id) });
      case "pl":
        return go({ type: "playlist", id });
      case "amode": {
        const v = view();
        v.mode = el.dataset.m;
        return vArtist(v);
      }
      // player
      case "toggle":
        return toggle();
      case "next":
        haptic();
        return next();
      case "prev":
        haptic();
        return prev();
      case "openfp":
        return openPlayer();
      case "closefp":
        return closePlayer();
      case "shuffle":
        S.shuffle = !S.shuffle;
        if (S.shuffle) shuffleQueue(true);
        haptic();
        updatePlayerUI();
        return toast(S.shuffle ? "🔀 " + L("shuffle") : "➡️");
      case "repeat":
        S.repeat = { off: "all", all: "one", one: "off" }[S.repeat];
        haptic();
        updatePlayerUI();
        return toast(L(S.repeat === "one" ? "repeatOne" : S.repeat === "all" ? "repeatAll" : "repeatOff"));
      case "fpfav": {
        const t = S.queue[S.qi];
        if (t) return toggleFav(t.id);
        return;
      }
      case "fpsend": {
        const t = S.queue[S.qi];
        if (t) return sendToChat(t.id);
        return;
      }
      case "fpaddpl": {
        const t = S.queue[S.qi];
        if (t) return addToPlSheet(t.id);
        return;
      }
      case "fpmenu": {
        const t = S.queue[S.qi];
        if (t) return trackMenu(t.id);
        return;
      }
      case "fpshare": {
        const t = S.queue[S.qi];
        if (t) return shareLink(`https://t.me/${(_b2 = S.bot) == null ? void 0 : _b2.username}?start=t_${t.id}`, `🎧 ${t.artist} — ${t.title}`);
        return;
      }
      case "showqueue":
        return showQueue();
      case "qjump":
        closeSheet();
        S.qi = Number(el.dataset.i);
        return loadCurrent();
      case "qrm": {
        const i = Number(el.dataset.i);
        S.queue.splice(i, 1);
        if (i < S.qi) S.qi--;
        updatePlayerUI();
        return showQueue();
      }
      // menu items
      case "closesheet":
        return closeSheet();
      case "m_next": {
        const t = S.tracks.get(Number(id));
        closeSheet();
        if (!S.queue.length) return playList([t], 0);
        S.queue.splice(S.qi + 1, 0, t);
        updatePlayerUI();
        return toast("✅ " + L("playNext"));
      }
      case "m_queue": {
        const t = S.tracks.get(Number(id));
        closeSheet();
        if (!S.queue.length) return playList([t], 0);
        S.queue.push(t);
        updatePlayerUI();
        return toast("✅ " + L("addQueue"));
      }
      case "m_addpl":
        return addToPlSheet(id);
      case "m_addto": {
        closeSheet();
        try {
          const r = await api(`/playlists/${el.dataset.pl}/tracks`, { method: "POST", body: { track_id: Number(id) } });
          toast(r.added ? L("added") : L("already"));
          hapticOk();
          S.playlists = [];
        } catch (e2) {
          toast(L("err"));
        }
        return;
      }
      case "m_fav":
        closeSheet();
        return toggleFav(id);
      case "m_send":
        closeSheet();
        return sendToChat(Number(id));
      case "m_similar": {
        closeSheet();
        closePlayer();
        try {
          const r = await api(`/track/${id}/related`);
          remember(r.items);
          const t = S.tracks.get(Number(id));
          go({ type: "set", id: 0, data: { set: { title: `${L("similar")}: ${(t == null ? void 0 : t.title) || ""}`, username: (t == null ? void 0 : t.artist) || "", artwork_url: t == null ? void 0 : t.artwork_url, is_album: false, id: 0 }, tracks: r.items } });
        } catch (e2) {
          toast(L("err"));
        }
        return;
      }
      case "m_open":
        closeSheet();
        return openExt(el.dataset.url);
      case "m_rmpl":
      case "rmpl": {
        closeSheet();
        const plId = el.dataset.pl || view().id;
        try {
          await api(`/playlists/${plId}/tracks/${id}`, { method: "DELETE" });
          toast(L("deleted"));
          haptic();
          S.playlists = [];
          if (view().type === "playlist") vPlaylist(view());
        } catch (e2) {
          toast(L("err"));
        }
        return;
      }
      case "mvup":
      case "mvdn": {
        const v = view();
        const tr = v.data.tracks;
        const i = tr.findIndex((t) => t.id === Number(id));
        const j = a === "mvup" ? i - 1 : i + 1;
        if (j < 0 || j >= tr.length) return;
        [tr[i], tr[j]] = [tr[j], tr[i]];
        haptic("soft");
        api(`/playlists/${v.id}/reorder`, { method: "POST", body: { track_ids: tr.map((t) => t.id) } }).catch(() => toast(L("err")));
        const box = root().querySelector(".list");
        if (box) box.outerHTML = trackList(tr, { ctx: setCtx("pl:" + v.id, tr), edit: true });
        return;
      }
      // playlists
      case "newpl": {
        const track = el.dataset.track;
        return promptSheet(L("newPl"), L("plName"), L("create"), "", async (name) => {
          try {
            const r = await api("/playlists", { method: "POST", body: { name, track_id: track ? Number(track) : void 0 } });
            toast(L("created"));
            hapticOk();
            S.playlists = [];
            if (view().type === "library") vLibrary();
            else if (!track) go({ type: "playlist", id: r.playlist.id });
          } catch (e2) {
            toast(L("err"));
          }
        });
      }
      case "importpl":
        return promptSheet(L("importPl"), L("scLink"), L("import"), "", async (url) => {
          toast(L("loading"));
          try {
            const r = await api("/import", { method: "POST", body: { url } });
            toast(L("imported", r.count));
            hapticOk();
            S.playlists = [];
            go({ type: "playlist", id: r.playlist.id });
          } catch (e2) {
            toast(L("err"));
          }
        });
      case "saveset": {
        toast(L("loading"));
        try {
          const r = await api("/import-set", { method: "POST", body: { set_id: Number(id) } });
          toast(L("imported", r.count));
          hapticOk();
          S.playlists = [];
        } catch (e2) {
          toast(L("err"));
        }
        return;
      }
      case "plplay": {
        const v = view();
        S.shuffle = false;
        return playList(v.data.tracks, 0);
      }
      case "plshuffle": {
        const v = view();
        S.shuffle = true;
        return playList(v.data.tracks, Math.floor(Math.random() * v.data.tracks.length));
      }
      case "plsend": {
        const v = view();
        toast(L("sending"));
        try {
          await api(`/playlists/${v.id}/send`, { method: "POST", body: {} });
          toast(L("sent"));
          hapticOk();
        } catch (e2) {
          toast(L("err"));
        }
        return;
      }
      case "plshare": {
        const v = view();
        try {
          const r = await api(`/playlists/${v.id}/share`);
          shareLink(r.link, "🎧 " + v.data.playlist.name);
        } catch (e2) {
          toast(L("err"));
        }
        return;
      }
      case "plmenu": {
        const v = view(), p = v.data.playlist;
        return openSheet(`<h3>${esc(p.is_favorites ? L("favorites") : p.name)}</h3>
        ${v.data.tracks.length ? `<button class="mi" data-act="pledit">${I("editI")} ${L("edit")}</button>` : ""}
        ${!p.is_favorites ? `<button class="mi" data-act="plrename">${I("editI")} ${L("rename")}</button>
        <button class="mi" data-act="plpub">${I("globe")} ${p.is_public ? L("private") : L("public")}</button>
        <button class="mi" data-act="plcopylink">${I("link")} ${L("copyLink")}</button>
        <button class="mi red" data-act="pldel">${I("trash")} ${L("del")}</button>` : ""}`);
      }
      case "pledit":
        closeSheet();
        view().edit = true;
        return vPlaylist(view());
      case "pldone":
        view().edit = false;
        return vPlaylist(view());
      case "plrename": {
        const v = view();
        return promptSheet(L("rename"), L("plName"), L("save"), v.data.playlist.name, async (name) => {
          try {
            await api(`/playlists/${v.id}`, { method: "PATCH", body: { name } });
            S.playlists = [];
            vPlaylist(v);
          } catch (e2) {
            toast(L("err"));
          }
        });
      }
      case "plpub": {
        closeSheet();
        const v = view();
        try {
          await api(`/playlists/${v.id}`, { method: "PATCH", body: { is_public: !v.data.playlist.is_public } });
          vPlaylist(v);
        } catch (e2) {
          toast(L("err"));
        }
        return;
      }
      case "plcopylink": {
        closeSheet();
        const v = view();
        try {
          const r = await api(`/playlists/${v.id}/share`);
          await ((_c2 = navigator.clipboard) == null ? void 0 : _c2.writeText(r.link));
          toast(L("copied"));
        } catch (e2) {
          toast(L("err"));
        }
        return;
      }
      case "pldel": {
        closeSheet();
        const v = view();
        const doDel = async () => {
          try {
            await api(`/playlists/${v.id}`, { method: "DELETE" });
            toast(L("deleted"));
            S.playlists = [];
            back();
            if (view().type === "library") vLibrary();
          } catch (e2) {
            toast(L("err"));
          }
        };
        if (tg == null ? void 0 : tg.showConfirm) tg.showConfirm(L("confirmDel"), (ok) => ok && doDel());
        else if (confirm(L("confirmDel"))) doDel();
        return;
      }
      case "copyshared": {
        try {
          const r = await api(`/shared/${el.dataset.code}/copy`, { method: "POST", body: {} });
          toast(L("copied"));
          hapticOk();
          go({ type: "playlist", id: r.id });
        } catch (e2) {
          toast(L("err"));
        }
        return;
      }
      // settings
      case "retry":
        return startApp();
      case "setlang": {
        lang = lang === "fa" ? "en" : "fa";
        applyLang();
        if (NATIVE) localStorage.setItem("sc_lang", lang);
        api("/settings", { method: "PATCH", body: { lang } }).catch(() => {
        });
        if (S.me) S.me.user.lang = lang;
        rebuildChrome();
        return render();
      }
      case "setq": {
        const q = ((_e = (_d = S.me) == null ? void 0 : _d.user) == null ? void 0 : _e.quality) === "low" ? "high" : "low";
        if (S.me) S.me.user.quality = q;
        api("/settings", { method: "PATCH", body: { quality: q } }).catch(() => {
        });
        return vSettings();
      }
      case "settheme": {
        S.theme = { auto: "dark", dark: "light", light: "auto" }[S.theme];
        localStorage.setItem("sc_theme", S.theme);
        applyTheme();
        return vSettings();
      }
      case "openbot": {
        const u = `https://t.me/${(_f = S.bot) == null ? void 0 : _f.username}`;
        if (tg == null ? void 0 : tg.openTelegramLink) {
          tg.openTelegramLink(u);
          return tg.close();
        }
        return openExt(u);
      }
      case "getapp":
        return openExt(((_g = S.bot) == null ? void 0 : _g.username) ? `https://t.me/${S.bot.username}?start=download` : DL.page);
      case "checkupd":
        return checkUpdate(true);
      case "updnow":
        closeSheet();
        return openExt(el.dataset.url);
      case "logout": {
        const doOut = async () => {
          try {
            await api("/auth/logout", { method: "POST" });
          } catch (e2) {
          }
          signedOut();
        };
        if (confirm(L("logoutQ"))) doOut();
        return;
      }
      case "login":
        return loginStart();
      case "loginreopen":
        return S.login && openExt(S.login.link);
      case "logincopy": {
        try {
          await navigator.clipboard.writeText(S.login.link);
          toast(L("copied"));
        } catch (e2) {
          prompt("", ((_h = S.login) == null ? void 0 : _h.link) || "");
        }
        return;
      }
      case "logincancel":
        loginStop();
        return showLogin();
      case "loginlang":
        lang = lang === "fa" ? "en" : "fa";
        localStorage.setItem("sc_lang", lang);
        applyLang();
        rebuildChrome();
        return showLogin();
    }
  }
  function applyLang() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
  }
  function applyTheme() {
    var _a2, _b2, _c2, _d;
    const scheme = S.theme === "auto" ? (tg == null ? void 0 : tg.colorScheme) || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark") : S.theme;
    document.body.classList.toggle("light", scheme === "light");
    document.documentElement.classList.toggle("light", scheme === "light");
    const bg = scheme === "light" ? "#f6f6fa" : "#0b0b10";
    try {
      (_a2 = tg == null ? void 0 : tg.setHeaderColor) == null ? void 0 : _a2.call(tg, bg);
      (_b2 = tg == null ? void 0 : tg.setBackgroundColor) == null ? void 0 : _b2.call(tg, bg);
      (_c2 = tg == null ? void 0 : tg.setBottomBarColor) == null ? void 0 : _c2.call(tg, bg);
    } catch (e) {
    }
    try {
      (_d = NATIVE == null ? void 0 : NATIVE.setTheme) == null ? void 0 : _d.call(NATIVE, bg, scheme === "light");
    } catch (e) {
    }
  }
  function rebuildChrome() {
    var _a2;
    const nav = $(".nav");
    nav.innerHTML = [["home", "home"], ["search", "search"], ["library", "lib"], ["settings", "cog"]].map(([t, ic]) => `<button data-tab="${t}" class="${S.tab === t ? "on" : ""}">${I(ic)}<span>${L(t)}</span></button>`).join("");
    ((_a2 = $(".fp .lbl")) == null ? void 0 : _a2.firstChild) && ($(".fp .lbl").firstChild.textContent = L("nowPlaying").toUpperCase());
  }
  async function boot() {
    var _a2, _b2, _c2;
    try {
      tg == null ? void 0 : tg.ready();
      tg == null ? void 0 : tg.expand();
      (_a2 = tg == null ? void 0 : tg.disableVerticalSwipes) == null ? void 0 : _a2.call(tg);
    } catch (e) {
    }
    applyLang();
    applyTheme();
    (_b2 = tg == null ? void 0 : tg.onEvent) == null ? void 0 : _b2.call(tg, "themeChanged", applyTheme);
    (_c2 = tg == null ? void 0 : tg.BackButton) == null ? void 0 : _c2.onClick(back);
    document.body.insertAdjacentHTML("beforeend", `<div id="app"><div id="view"></div></div><nav class="nav"></nav>`);
    rebuildChrome();
    $(".nav").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-tab]");
      if (b) setTab(b.dataset.tab);
    });
    $("#app").addEventListener("click", onClick);
    buildPlayer();
    if (NATIVE) {
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden && S.login) loginPollOnce();
      });
      if (!appToken) return showLogin();
      return startApp();
    }
    if (!initData) {
      root().innerHTML = `<div class="view">${emptyBox("bot", L("unauthorized"))}</div>`;
      return;
    }
    return startApp();
  }
  function showLogin() {
    document.body.classList.add("auth");
    closePlayer();
    closeSheet();
    const w = S.login;
    root().innerHTML = `<div class="view login">
    <button class="lg-lang" data-act="loginlang">${I("globe")} ${lang === "fa" ? "English" : "فارسی"}</button>
    <div class="lg-logo"><svg viewBox="0 0 64 64"><g fill="#fff">${[[10, 22, 20], [18, 14, 36], [26, 6, 52], [34, 16, 32], [42, 10, 44], [50, 20, 24]].map(([x, y, h]) => `<rect x="${x}" y="${y + (52 - h) / 2 - (y - 6) / 2}" width="5" height="${h}" rx="2.5"/>`).join("")}</g></svg></div>
    <h1>SoundCloud Player</h1>
    <p class="lg-sub">${L("loginSub")}</p>
    ${w ? `<div class="lg-wait">
        <div class="spin"></div><div class="lg-wt">${L("loginWait")}</div>
        ${window.qrcode ? `<div class="lg-qr">${qrSvg(w.link)}</div><div class="lg-hint">${L("loginQr")}</div>` : ""}
        <div class="row2"><button class="btn" data-act="logincopy">${I("link")} ${L("copyLink")}</button><button class="btn pri" data-act="loginreopen">${I("tg")} ${L("loginReopen")}</button></div>
        <button class="lg-cancel" data-act="logincancel">${L("cancel")}</button></div>` : `<button class="btn pri lg-btn" data-act="login">${I("tg")} ${L("login")}</button>`}
    <div class="lg-feat">${I("music")} SoundCloud · ${I("heart")} Playlists · ${I("send")} Telegram</div>
  </div>`;
  }
  function qrSvg(text) {
    try {
      const q = window.qrcode(0, "M");
      q.addData(text);
      q.make();
      return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
    } catch (e) {
      return "";
    }
  }
  let loginTimer = null;
  async function loginStart() {
    haptic();
    try {
      const d = await api("/auth/start", { method: "POST", body: { device: (NATIVE == null ? void 0 : NATIVE.device) || (NATIVE == null ? void 0 : NATIVE.platform) || "App" } });
      S.login = { code: d.code, link: d.link, until: Date.now() + (d.expires_in || 600) * 1e3 };
      showLogin();
      openExt(d.link);
      clearInterval(loginTimer);
      loginTimer = setInterval(loginPollOnce, 2500);
    } catch (e) {
      toast(L("err"));
    }
  }
  function loginStop() {
    clearInterval(loginTimer);
    loginTimer = null;
    S.login = null;
  }
  let polling = false;
  async function loginPollOnce() {
    const w = S.login;
    if (!w || polling) return;
    if (Date.now() > w.until) {
      loginStop();
      showLogin();
      return toast(L("loginExpired"));
    }
    polling = true;
    try {
      const r = await api(`/auth/poll?code=${encodeURIComponent(w.code)}`);
      if (r.status === "ok" && r.token) {
        loginStop();
        appToken = r.token;
        localStorage.setItem("sc_token", appToken);
        document.body.classList.remove("auth");
        hapticOk();
        toast(L("loginOk"));
        startApp();
      } else if (r.status === "denied" || r.status === "expired") {
        loginStop();
        showLogin();
        toast(L(r.status === "denied" ? "loginDenied" : "loginExpired"));
      }
    } catch (e) {
    } finally {
      polling = false;
    }
  }
  function signedOut() {
    appToken = "";
    localStorage.removeItem("sc_token");
    try {
      audio.pause();
    } catch (e) {
    }
    S.queue = [];
    S.qi = -1;
    S.me = null;
    S.playlists = [];
    S.favs = /* @__PURE__ */ new Set();
    S.favId = null;
    S.stack = [{ type: "home" }];
    S.tab = "home";
    updatePlayerUI();
    pushNative();
    rebuildChrome();
    showLogin();
  }
  const cmpVer = (a, b) => {
    const x = String(a).split(".").map(Number), y = String(b).split(".").map(Number);
    for (let i = 0; i < 3; i++) {
      if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0) ? 1 : -1;
    }
    return 0;
  };
  async function checkUpdate(manual) {
    var _a2;
    if (!NATIVE) return;
    try {
      const r = await fetch(`https://api.github.com/repos/${GH_REPO}/releases/latest`, { headers: { Accept: "application/vnd.github+json" } });
      const j = await r.json();
      const v = String(j.tag_name || "").replace(/^v/, "");
      if (v && cmpVer(v, NATIVE.version) > 0) {
        const url = NATIVE.platform === "android" ? DL.apk : DL.exe;
        S.update = { v, url };
        if (S.tab === "settings" && ((_a2 = view()) == null ? void 0 : _a2.type) === "settings") render();
        if (!manual && localStorage.getItem("sc_upd_seen") === v) return;
        localStorage.setItem("sc_upd_seen", v);
        openSheet(`<div class="upd"><div class="ico">${I("download")}</div><h3>${L("updTitle")}</h3><p>${L("updAvail", esc(v))}</p>
        <div class="row2"><button class="btn" data-act="closesheet">${L("later")}</button><button class="btn pri" data-act="updnow" data-url="${esc(url)}">${I("download")} ${L("updDl")}</button></div></div>`);
      } else if (manual) toast(L("upToDate"));
    } catch (e) {
      if (manual) toast(L("err"));
    }
  }
  async function startApp() {
    var _a2;
    document.body.classList.remove("auth");
    try {
      S.me = await api("/me");
      S.bot = S.me.bot;
      if (S.me.user.lang && S.me.user.lang !== lang) {
        lang = S.me.user.lang;
        applyLang();
        rebuildChrome();
      }
      if (NATIVE) localStorage.setItem("sc_lang", lang);
    } catch (e) {
      if (NATIVE && e.status === 401) return;
      root().innerHTML = `<div class="view">${emptyBox("bot", e.status === 401 ? L("unauthorized") : L("err"))}<div style="text-align:center"><button class="btn pri" data-act="retry">${L("retry")}</button></div></div>`;
      return;
    }
    if (NATIVE) setTimeout(() => checkUpdate(false), 4e3);
    const sp = ((_a2 = tg == null ? void 0 : tg.initDataUnsafe) == null ? void 0 : _a2.start_param) || "";
    S.stack = [{ type: "home" }];
    if (sp.startsWith("pl_")) S.stack.push({ type: "shared", code: sp.slice(3) });
    render();
    syncBack();
    if (sp.startsWith("t_")) {
      try {
        const d = await api(`/track/${sp.slice(2)}`);
        remember([d.track]);
        playList([d.track], 0);
        openPlayer();
      } catch (e) {
      }
    }
    if (sp.startsWith("s_")) {
      S.search.q = "";
      setTab("search");
      doSearch(decodeURIComponent(sp.slice(2)).replace(/_/g, " "));
    }
    loadFavs();
  }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", boot) : boot();
})();
