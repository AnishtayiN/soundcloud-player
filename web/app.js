(() => {
  "use strict";
  var _a, _b, _c, _d, _e, _f;
  const API = window.SC_API || "https://fywphggwavthubehvvuh.supabase.co/functions/v1/scbot/api";
  const NATIVE = window.SCNative || null;
  const tg = NATIVE ? null : (_a = window.Telegram) == null ? void 0 : _a.WebApp;
  const initData = NATIVE ? "" : (tg == null ? void 0 : tg.initData) || new URLSearchParams(location.hash.slice(1)).get("tgWebAppData") || "";
  let appToken = NATIVE ? localStorage.getItem("sc_token") || "" : "";
  const GH_REPO = "AnishtayiN/soundcloud-player";
  const APP_LINK = "https://soundclouddl-player.netlify.app";
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
      updDlInstall: "دانلود و نصب",
      updInstall: "نصب",
      updDownloading: "در حال دانلود…",
      updInstallA: "دانلود تموم شد ✅ توی صفحه‌ای که باز شد «نصب» رو بزن.",
      updInstallW: "دانلود تموم شد ✅ در حال نصب… برنامه خودش بسته و دوباره باز می‌شه.",
      updPerm: "برای نصب آپدیت، توی صفحه‌ای که باز شد اجازه «نصب برنامه‌های ناشناس» رو روشن کن و برگرد.",
      updFail: "دانلود ناموفق بود، اینترنتت رو چک کن و دوباره امتحان کن.",
      recTitle: "تشخیص آهنگ",
      recListen: "دارم گوش می‌دم…",
      recHint: "گوشی رو نزدیک منبع صدا بگیر",
      recFinding: "دارم پیدا می‌کنم…",
      recNone: "آهنگ پیدا نشد 😕",
      recNoneSub: "نزدیک‌تر به منبع صدا و با صدای بلندتر دوباره امتحان کن",
      recAgain: "دوباره امتحان کن",
      recFile: "از فایل صوتی",
      recMicErr: "به میکروفون دسترسی ندارم",
      recMicErrSub: "اجازه‌ی میکروفون رو بده، یا از فایل صوتی استفاده کن، یا ویس رو برای ربات بفرست",
      recBot: "ویس رو برای ربات می‌فرستم",
      recBusy: "سرویس تشخیص شلوغه؛ چند ثانیه دیگه دوباره امتحان کن",
      recNoSc: "این آهنگ توی ساندکلاد پیدا نشد",
      recOnSc: "در ساندکلاد",
      recStop: "توقف",
      recFileErr: "این فایل قابل پخش نیست",
      lyFound: "پیدا شده از روی متن آهنگ",
      lyOther: "نتایج دیگر",
      ofTitle: "آهنگ‌های آفلاین",
      ofShort: "آفلاین",
      ofSection: "آفلاین و حافظه",
      ofAuto: "ذخیره خودکار برای آفلاین",
      ofOn: "روشن",
      ofOff: "خاموش",
      ofLimit: "حداکثر حجم حافظه",
      ofUnlimited: "نامحدود",
      ofClear: "پاک کردن حافظه آفلاین",
      ofClearQ: "همه‌ی آهنگ‌های آفلاین پاک بشن؟",
      ofCleared: "حافظه‌ی آفلاین پاک شد",
      ofSave: "دانلود برای آفلاین",
      ofRemove: "حذف از آفلاین",
      ofSaved: "برای آفلاین ذخیره شد ✅",
      ofRemoved: "از آفلاین حذف شد",
      ofDl: (p) => `در حال دانلود… ${p}%`,
      ofEmpty: "هنوز آهنگی ذخیره نشده",
      ofEmptySub: "هر آهنگی که کامل پخش بشه خودکار ذخیره می‌شه و دفعه‌ی بعد بدون مصرف اینترنت پخش می‌شه.",
      ofMode: "اینترنت قطعه — آهنگ‌های آفلاینت در دسترسن 📥",
      ofNot: "این آهنگ آفلاین ذخیره نشده",
      ofAllQ: (n) => `دانلود ${n} آهنگ برای آفلاین؟`,
      ofAllProg: (d, n) => `📥 ذخیره برای آفلاین: ${d}/${n}`,
      ofAllDone: (n) => `${n} آهنگ برای آفلاین ذخیره شد ✅`,
      ofAllHave: "همه‌ی آهنگ‌های این لیست آفلاین هستن ✅",
      ofBack: "اینترنت وصل شد ✅",
      ofCount: (n, sz) => `${n} آهنگ · ${sz}`,
      ofNoNet: "پخش بدون اینترنت",
      ofPlayAll: "پخش همه",
      ofFull: "حافظه‌ی آفلاین پره؛ قدیمی‌ترها پاک شدن",
      yes: "بله",
      ofTooBig: (l) => `این آهنگ از سقف حافظه‌ی آفلاین (${l}) بزرگ‌تره؛ از تنظیمات سقف رو بیشتر کن.`,
      ofAllTooBig: (n, l) => `حجم این لیست (حدود ${n}) از سقف حافظه‌ی آفلاین (${l}) بیشتره؛ از تنظیمات سقف رو بیشتر کن.`,
      ofCanceled: "دانلود آفلاین لغو شد",
      ofCancelQ: "دانلود این آهنگ لغو بشه؟",
      ofCancelAllQ: "دانلود آفلاین این لیست در حال انجامه. لغوش کنم؟",
      updVerify: "در حال بررسی سالم بودن فایل…",
      updReadyA: "دانلود تموم شد و سالم بودن فایل تأیید شد ✅ برای نصب، «نصب» رو بزن.",
      updReadyW: "دانلود تموم شد و سالم بودن فایل تأیید شد ✅ برای نصب، «نصب» رو بزن؛ برنامه بسته و دوباره باز می‌شه.",
      updBad: "فایل دانلودشده سالم نبود و برای امنیتت نصب نشد. دوباره امتحان کن.",
      shareTitle: "اشتراک‌گذاری",
      shareTg: "ارسال در تلگرام",
      shareOpen: "باز کردن لینک",
      later: "بعداً",
      upToDate: "آخرین نسخه رو داری ✅",
      getApp: "اپ اندروید و ویندوز",
      feat: "ساخته شده با ❤️ برای عاشقای موسیقی",
      // v1.4 — queue · resume · smart offline · lyrics · stats · recognition · sleep/speed/EQ
      qClear: "پاک کردن صف",
      qClearQ: "همه‌ی آهنگ‌های صف به جز آهنگی که در حال پخشه پاک بشن؟",
      qCleared: "صف پاک شد",
      qPlay: "پخش این آهنگ",
      qNext: "پخش بعد از آهنگ فعلی",
      qEnd: "انتقال به آخر صف",
      qRemove: "حذف از صف",
      qRemoved: "از صف حذف شد",
      qMovedNext: "بعد از همین آهنگ پخش می‌شه ✅",
      qMovedEnd: "به آخر صف رفت ✅",
      qDrag: "برای جابه‌جایی بکش",
      shuffleOn: "🔀 پخش تصادفی روشن شد",
      shuffleOff: "پخش تصادفی خاموش شد؛ ترتیب اصلی برگشت",
      qSkipped: "این آهنگ در دسترس نبود؛ رفتیم سراغ بعدی",
      qAllFail: "هیچ‌کدوم از آهنگ‌های صف در دسترس نیستن",
      rsFrom: (d) => `از دستگاه دیگه${d ? ` (${d})` : ""}`,
      rsAt: (t) => `ادامه از دقیقه‌ی ${t}`,
      rsStart: "پخش دوباره از اول",
      rsGo: "ادامه",
      dlTitle: "دانلودها",
      dlProg: (d, n) => `${d} از ${n} آهنگ`,
      dlCancelAll: "لغو همه",
      dlRetry: "تلاش دوباره برای ناموفق‌ها",
      dlCancel: "لغو",
      dlQueued: "در صف دانلود",
      dlDone: "دانلود شد",
      dlFail: "ناموفق",
      dlCanceled: "لغو شد",
      dlSkip: "از قبل آفلاین بود",
      dlNone: "دانلودی در جریان نیست",
      dlNoneSub: "از منوی هر آهنگ یا دکمه‌ی دانلود پلی‌لیست، آهنگ‌ها رو برای پخش بدون اینترنت ذخیره کن.",
      dlStarted: (n) => `دانلود ${n} آهنگ شروع شد`,
      dlClearDone: "پاک کردن تمام‌شده‌ها",
      dlNoRoomLimit: (need, free) => `جا نیست: این دانلود حدود ${need} فضا لازم داره ولی از سقف حافظه‌ی آفلاین فقط ${free} خالیه. از تنظیمات سقف رو بیشتر کن یا چند آهنگ آفلاین رو پاک کن.`,
      dlNoRoomDisk: (need, free) => `فضای خالی دستگاه کافی نیست: حدود ${need} لازمه ولی فقط ${free} آزاده.`,
      dlNet: "اتصال قطع شد یا اینترنت همراه شد؛ دانلود خودکار متوقف شد",
      dlErrDrm: "این آهنگ محافظت شده",
      dlErrBig: "از سقف حافظه بزرگ‌تره",
      dlErrQ: "این کیفیت دیگه در دسترس نیست",
      qualTitle: "کیفیت دانلود آفلاین",
      qualHigh: "کیفیت بالا",
      qualLow: "کم‌حجم",
      qualApprox: (s) => `حدود ${s}`,
      qualDefault: "پیش‌فرض",
      qualLoading: "در حال گرفتن کیفیت‌های واقعی این آهنگ…",
      qualNone: "برای این آهنگ کیفیت قابل دانلودی پیدا نشد",
      ofQ: "کیفیت پیش‌فرض دانلود",
      ofQSub: "قبل از هر دانلود، کیفیت‌های واقعی آهنگ و حجم تقریبی نشون داده می‌شه",
      dlBatchQ: (n) => `دانلود ${n} آهنگ برای آفلاین`,
      dlBatchSub: "حجم‌ها تقریبیه و از نرخ بیت واقعی ساندکلاد حساب شده.",
      favAuto: "دانلود خودکار علاقه‌مندی‌ها",
      favAutoSub: "فقط روی Wi-Fi یا اینترنت کابلی؛ هیچ‌وقت روی اینترنت همراه",
      favAutoUnknown: "این دستگاه نوع اتصال رو گزارش نمی‌ده؛ برای همین قبل از هر دانلود خودکار ازت اجازه می‌گیرم",
      favAutoAsk: (n) => `${n} آهنگ از علاقه‌مندی‌هات هنوز آفلاین نیست. نوع اتصال این دستگاه معلوم نیست؛ اگه به Wi-Fi وصلی، دانلود بشن؟`,
      favAutoStart: (n) => `📥 دانلود خودکار ${n} آهنگ علاقه‌مندی (Wi-Fi)`,
      download: "دانلود",
      lyTitle: "متن آهنگ",
      lyNone: "متن آهنگ پیدا نشد",
      lyInstr: "این آهنگ بی‌کلام ثبت شده",
      lyErr: "متن آهنگ الان در دسترس نیست",
      lyOffline: "این آهنگ هنوز متنی روی دستگاه نداره؛ برای دیدن متن به اینترنت وصل شو",
      lySrc: (a, t) => `متن از LRCLIB · ${a} — ${t}`,
      lyLbl: "متن",
      stTitle: "آمار من",
      st7: "۷ روز اخیر",
      st30: "۳۰ روز اخیر",
      stAll: "همه‌ی زمان‌ها",
      stMinutes: "دقیقه گوش دادن",
      stPlays: "پخش",
      stTracks: "آهنگ متفاوت",
      stTopArtists: "خواننده‌های برتر",
      stTopTracks: "آهنگ‌های برتر",
      stEmpty: "هنوز آماری نیست",
      stEmptySub: "هر آهنگی که حداقل ۳۰ ثانیه یا بیشتر از نصفش رو گوش بدی، اینجا حساب می‌شه.",
      stRule: "پخش حساب‌شده یعنی حداقل ۳۰ ثانیه یا بیشتر از نصف آهنگ. آمار فقط از تاریخچه‌ی همین دستگاهه و جایی فرستاده نمی‌شه.",
      stShare: "اشتراک‌گذاری خلاصه",
      stClear: "پاک کردن تاریخچه‌ی آمار",
      stClearQ: "تاریخچه‌ی پخش این دستگاه پاک بشه؟ آمار از صفر شروع می‌شه.",
      stCleared: "تاریخچه‌ی آمار پاک شد",
      stPlaysN: (n) => `${n} پخش`,
      stMinN: (n) => `${n} دقیقه`,
      stCard: (r, m, n, a, t) => `🎧 آمار من در SoundCloud Player — ${r}
⏱ ${m} دقیقه گوش دادم · ${n} آهنگ متفاوت${a ? `
🎤 خواننده‌ی محبوبم: ${a}` : ""}${t ? `
🎵 آهنگ محبوبم: ${t}` : ""}`,
      recBest: "همین آهنگ در ساندکلاد",
      recSearchSc: "جستجو در ساندکلاد",
      recNoScSub: "آهنگ تشخیص داده شد، ولی نسخه‌ای ازش توی ساندکلاد پیدا نکردیم.",
      recHist: "تشخیص‌های قبلی",
      recHistEmpty: "هنوز آهنگی تشخیص ندادی",
      recHistSub: "آهنگ‌هایی که با میکروفون یا فایل تشخیص بدی، اینجا می‌مونن.",
      recHistClear: "پاک کردن تاریخچه",
      recQueue: "به صف",
      recPl: "به پلی‌لیست",
      slTitle: "تایمر خواب",
      slMin: (n) => `${n} دقیقه`,
      slEnd: "پایان آهنگ فعلی",
      slOff: "لغو تایمر",
      slSet: (t) => `پخش ${t} دیگه متوقف می‌شه 🌙`,
      slSetEnd: "پخش آخر همین آهنگ متوقف می‌شه 🌙",
      slCanceled: "تایمر خواب لغو شد",
      slStopped: "تایمر خواب: پخش متوقف شد 🌙",
      slFade: "۱۵ ثانیه‌ی آخر، صدا کم‌کم آروم می‌شه و بعد پخش متوقف می‌شه.",
      slLeft: (t) => `${t} مونده`,
      timerLbl: "تایمر",
      spTitle: "سرعت پخش",
      spLbl: "سرعت",
      eqTitle: "اکولایزر",
      eqLbl: "اکولایزر",
      eqFlat: "تخت",
      eqBass: "بم",
      eqVocal: "وکال",
      eqTreble: "تریبل",
      eqCustom: "دستی",
      eqNote: "تغییرات مستقیم روی صدای در حال پخش اعمال می‌شه."
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
      updDlInstall: "Download & install",
      updInstall: "Install",
      updDownloading: "Downloading…",
      updInstallA: "Download complete ✅ Tap “Install” on the screen that opened.",
      updInstallW: "Download complete ✅ Installing… the app will close and reopen by itself.",
      updPerm: "To install the update, allow “Install unknown apps” on the screen that opened, then come back.",
      updFail: "Download failed — check your connection and try again.",
      recTitle: "Recognize song",
      recListen: "Listening…",
      recHint: "Hold your phone close to the music",
      recFinding: "Finding it…",
      recNone: "No match 😕",
      recNoneSub: "Get closer to the speaker and try again",
      recAgain: "Try again",
      recFile: "From an audio file",
      recMicErr: "Can't access the microphone",
      recMicErrSub: "Allow microphone access, use an audio file, or send a voice message to the bot",
      recBot: "Send a voice to the bot",
      recBusy: "Recognition is busy — try again in a few seconds",
      recNoSc: "Not found on SoundCloud",
      recOnSc: "On SoundCloud",
      recStop: "Stop",
      recFileErr: "Can't read this file",
      lyFound: "Found by the lyrics",
      lyOther: "Other results",
      ofTitle: "Offline songs",
      ofShort: "Offline",
      ofSection: "Offline & storage",
      ofAuto: "Auto-save for offline",
      ofOn: "On",
      ofOff: "Off",
      ofLimit: "Storage limit",
      ofUnlimited: "Unlimited",
      ofClear: "Clear offline storage",
      ofClearQ: "Delete all offline songs?",
      ofCleared: "Offline storage cleared",
      ofSave: "Download for offline",
      ofRemove: "Remove from offline",
      ofSaved: "Saved for offline ✅",
      ofRemoved: "Removed from offline",
      ofDl: (p) => `Downloading… ${p}%`,
      ofEmpty: "No offline songs yet",
      ofEmptySub: "Every song you play to the end is saved automatically and plays next time without using data.",
      ofMode: "You're offline — your saved songs are available 📥",
      ofNot: "This song isn't saved for offline",
      ofAllQ: (n) => `Download ${n} songs for offline?`,
      ofAllProg: (d, n) => `📥 Saving for offline: ${d}/${n}`,
      ofAllDone: (n) => `${n} songs saved for offline ✅`,
      ofAllHave: "All songs in this list are already offline ✅",
      ofBack: "Back online ✅",
      ofCount: (n, sz) => `${n} songs · ${sz}`,
      ofNoNet: "Plays without internet",
      ofPlayAll: "Play all",
      ofFull: "Offline storage full — oldest songs removed",
      yes: "Yes",
      ofTooBig: (l) => `This song is larger than the offline storage limit (${l}). Raise the limit in Settings.`,
      ofAllTooBig: (n, l) => `This list (about ${n}) is larger than the offline storage limit (${l}). Raise the limit in Settings.`,
      ofCanceled: "Offline download canceled",
      ofCancelQ: "Cancel downloading this song?",
      ofCancelAllQ: "This list is being downloaded for offline. Cancel it?",
      updVerify: "Verifying the download…",
      updReadyA: "Download complete and verified ✅ Tap “Install” to install it.",
      updReadyW: "Download complete and verified ✅ Tap “Install” — the app will close and reopen.",
      updBad: "The downloaded file failed the integrity check and was not installed. Please try again.",
      shareTitle: "Share",
      shareTg: "Send in Telegram",
      shareOpen: "Open link",
      later: "Later",
      upToDate: "You're on the latest version ✅",
      getApp: "Android & Windows apps",
      feat: "Made with ❤️ for music lovers",
      // v1.4
      qClear: "Clear queue",
      qClearQ: "Remove every song from the queue except the one playing?",
      qCleared: "Queue cleared",
      qPlay: "Play this song",
      qNext: "Play after the current song",
      qEnd: "Move to end of queue",
      qRemove: "Remove from queue",
      qRemoved: "Removed from queue",
      qMovedNext: "Plays right after this song ✅",
      qMovedEnd: "Moved to the end ✅",
      qDrag: "Drag to reorder",
      shuffleOn: "🔀 Shuffle on",
      shuffleOff: "Shuffle off — original order restored",
      qSkipped: "This song isn't available — skipped to the next",
      qAllFail: "None of the songs in the queue are available",
      rsFrom: (d) => `From another device${d ? ` (${d})` : ""}`,
      rsAt: (t) => `Resume at ${t}`,
      rsStart: "Play again from the start",
      rsGo: "Resume",
      dlTitle: "Downloads",
      dlProg: (d, n) => `${d} of ${n} songs`,
      dlCancelAll: "Cancel all",
      dlRetry: "Retry failed",
      dlCancel: "Cancel",
      dlQueued: "Queued",
      dlDone: "Downloaded",
      dlFail: "Failed",
      dlCanceled: "Canceled",
      dlSkip: "Already offline",
      dlNone: "No downloads in progress",
      dlNoneSub: "Use a song's menu or a playlist's download button to save songs for listening without internet.",
      dlStarted: (n) => `Downloading ${n} songs`,
      dlClearDone: "Clear finished",
      dlNoRoomLimit: (need, free) => `Not enough room: this download needs about ${need} but only ${free} is left under the offline storage limit. Raise the limit in Settings or remove some offline songs.`,
      dlNoRoomDisk: (need, free) => `Not enough free space on this device: about ${need} is needed but only ${free} is free.`,
      dlNet: "Connection lost or switched to mobile data — auto-download stopped",
      dlErrDrm: "This song is protected",
      dlErrBig: "Larger than the storage limit",
      dlErrQ: "This quality is no longer available",
      qualTitle: "Offline download quality",
      qualHigh: "High quality",
      qualLow: "Data saver",
      qualApprox: (s) => `about ${s}`,
      qualDefault: "Default",
      qualLoading: "Getting this song's real quality options…",
      qualNone: "No downloadable quality found for this song",
      ofQ: "Default download quality",
      ofQSub: "Before each download you see the song's real qualities and approximate size",
      dlBatchQ: (n) => `Download ${n} songs for offline`,
      dlBatchSub: "Sizes are approximate, computed from SoundCloud's real bitrates.",
      favAuto: "Auto-download favorites",
      favAutoSub: "Only on Wi-Fi or wired internet — never on mobile data",
      favAutoUnknown: "This device doesn't report its connection type, so you'll be asked before every automatic download",
      favAutoAsk: (n) => `${n} of your favorites aren't offline yet. This device can't tell its connection type — download them if you're on Wi-Fi?`,
      favAutoStart: (n) => `📥 Auto-downloading ${n} favorites (Wi-Fi)`,
      download: "Download",
      lyTitle: "Lyrics",
      lyNone: "Lyrics not found",
      lyInstr: "This track is listed as instrumental",
      lyErr: "Lyrics aren't available right now",
      lyOffline: "No lyrics saved for this song yet — connect to the internet to see them",
      lySrc: (a, t) => `Lyrics from LRCLIB · ${a} — ${t}`,
      lyLbl: "Lyrics",
      stTitle: "My stats",
      st7: "Last 7 days",
      st30: "Last 30 days",
      stAll: "All time",
      stMinutes: "minutes listened",
      stPlays: "plays",
      stTracks: "different songs",
      stTopArtists: "Top artists",
      stTopTracks: "Top songs",
      stEmpty: "No stats yet",
      stEmptySub: "Every song you listen to for at least 30 seconds or more than half of it is counted here.",
      stRule: "A counted play = at least 30 seconds or more than half of the song. Stats come only from this device's history and are never uploaded.",
      stShare: "Share summary",
      stClear: "Clear stats history",
      stClearQ: "Clear this device's listening history? Stats start from zero.",
      stCleared: "Stats history cleared",
      stPlaysN: (n) => `${n} plays`,
      stMinN: (n) => `${n} min`,
      stCard: (r, m, n, a, t) => `🎧 My SoundCloud Player stats — ${r}
⏱ ${m} minutes listened · ${n} different songs${a ? `
🎤 Top artist: ${a}` : ""}${t ? `
🎵 Top song: ${t}` : ""}`,
      recBest: "This song on SoundCloud",
      recSearchSc: "Search SoundCloud",
      recNoScSub: "The song was recognized, but we couldn't find it on SoundCloud.",
      recHist: "Recognition history",
      recHistEmpty: "No recognized songs yet",
      recHistSub: "Songs you recognize with the mic or a file stay here.",
      recHistClear: "Clear history",
      recQueue: "Queue",
      recPl: "Playlist",
      slTitle: "Sleep timer",
      slMin: (n) => `${n} min`,
      slEnd: "End of current song",
      slOff: "Cancel timer",
      slSet: (t) => `Playback stops in ${t} 🌙`,
      slSetEnd: "Playback stops at the end of this song 🌙",
      slCanceled: "Sleep timer canceled",
      slStopped: "Sleep timer: playback stopped 🌙",
      slFade: "During the last 15 seconds the volume fades out, then playback stops.",
      slLeft: (t) => `${t} left`,
      timerLbl: "Timer",
      spTitle: "Playback speed",
      spLbl: "Speed",
      eqTitle: "Equalizer",
      eqLbl: "EQ",
      eqFlat: "Flat",
      eqBass: "Bass",
      eqVocal: "Vocal",
      eqTreble: "Treble",
      eqCustom: "Custom",
      eqNote: "Changes are applied to the audio that's playing."
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
    mic: "M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3m5.3-3A5.3 5.3 0 0 1 12 16.1 5.3 5.3 0 0 1 6.7 11H5c0 3.4 2.7 6.2 6 6.7V21h2v-3.3c3.3-.5 6-3.3 6-6.7z",
    afile: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm2 10h-3v4.5a2.5 2.5 0 1 1-1-2V10h4zm-3-3V3.5L18.5 9z",
    offline: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m-1.6 14.6L6 12.2l1.4-1.4 3 3 6.2-6.2 1.4 1.4z",
    storage: "M2 20h20v-4H2zm2-3h2v2H4zM2 4v4h20V4zm4 3H4V5h2zm-4 7h20v-4H2zm2-3h2v2H4z",
    trash2: "M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6zM19 4h-3.5l-1-1h-5l-1 1H5v2h14z",
    tg: "M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z",
    drag: "M20 9H4v2h16zM4 15h16v-2H4z",
    lyrics: "M14 17H4v2h10zm6-8H4v2h16zM4 15h16v-2H4zM4 5v2h16V5z",
    timer: "M15 1H9v2h6zm-4 13h2V8h-2zm8.03-6.61 1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42A8.96 8.96 0 0 0 12 4a9 9 0 1 0 9 9c0-2.12-.74-4.07-1.97-5.61M12 20a7 7 0 1 1 0-14 7 7 0 0 1 0 14",
    speed: "M20.38 8.57l-1.23 1.85a8 8 0 0 1-.22 7.58H5.07A8 8 0 0 1 15.58 6.85l1.85-1.23A10 10 0 0 0 3.35 19a2 2 0 0 0 1.72 1h13.85a2 2 0 0 0 1.74-1 10 10 0 0 0-.27-10.44zm-9.79 6.84a2 2 0 0 0 2.83 0l5.66-8.49-8.49 5.66a2 2 0 0 0 0 2.83",
    eq: "M3 17v2h6v-2zM3 5v2h10V5zm10 16v-2h8v-2h-8v-2h-2v6zM7 9v2H3v2h4v2h2V9zm14 4v-2H11v2zm-6-4h2V7h4V5h-4V3h-2z",
    stats: "M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z",
    history: "M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.95 8.95 0 0 0 13 21a9 9 0 0 0 0-18m-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8z",
    retry: "M17.65 6.35A7.96 7.96 0 0 0 12 4a8 8 0 1 0 7.73 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4z",
    wifi: "M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9m8 8 3 3 3-3a4.24 4.24 0 0 0-6 0m-4-4 2 2a7.07 7.07 0 0 1 10 0l2-2C15.14 9.14 8.87 9.14 5 13"
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
    if (recLive()) closeSheet();
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
    if (recLive()) closeSheet();
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
    const r = { home: vHome, search: vSearch, library: vLibrary, settings: vSettings, playlist: vPlaylist, artist: vArtist, set: vSet, shared: vShared, offline: vOffline, downloads: vDownloads, stats: vStats, rechist: vRecHist }[v.type];
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
      <div class="a" dir="auto">${dlBadge(t.id)}${OFF.ids.has(t.id) ? `<span class="offi" title="offline">${I("offline")}</span>` : ""}${lock ? `<span class="lock">${I("lock")}</span>` : ""}${esc(t.artist)} · ${fmtDur(t.duration_ms)}${t.playback_count ? ` · ▶ ${fmtNum(t.playback_count)}` : ""}</div></div>
    ${opts.edit ? `<div class="edit-btns"><button data-act="mvup" data-id="${t.id}">${I("up")}</button><button data-act="mvdn" data-id="${t.id}">${I("down")}</button><button class="del" data-act="rmpl" data-id="${t.id}">${I("close")}</button></div>` : `<button class="more" data-act="menu" data-id="${t.id}" data-ctx="${opts.ctx || ""}">${I("more")}</button>`}
  </div>`;
  }
  const trackList = (arr, opts = {}) => `<div class="list">${arr.map((t, i) => trackRow(t, i + (opts.start || 0), opts)).join("")}</div>`;
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
    var _a2, _b2, _c2, _d2, _e2, _f2, _g;
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
    <div class="foot">🎧 @${esc(((_d2 = S.bot) == null ? void 0 : _d2.username) || "")}</div>
  </div>`;
    loadTrending();
    try {
      const h = S.home || (S.home = await api("/home"));
      remember(h.top);
      remember(h.recent);
      if (((_e2 = view()) == null ? void 0 : _e2.type) !== "home") return;
      if ((_f2 = h.recent) == null ? void 0 : _f2.length) $("#recentBox").innerHTML = `<div class="h2"><h2>🕘 ${L("recent")}</h2></div><div class="hs">${h.recent.map((t, i) => hCard(t, setCtx("recent", h.recent), i)).join("")}</div>`;
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
  const REC = { stream: null, ctx: null, node: null, chunks: [], len: 0, rate: 48e3, run: 0, busy: false, active: false, fileCtx: null };
  function recSheet(state, extra = "") {
    const orb = (cls) => `<div class="recorb ${cls}"><span></span><span></span><span></span><button data-act="${cls === "on" ? "recstop" : "recagain"}">${I("mic")}</button></div>`;
    if (state === "listen") return `<div class="rec">${orb("on")}<h3>${L("recListen")}</h3><p>${L("recHint")}</p><div class="recbar"><i id="recprog"></i></div><button class="btn" data-act="recfile">${I("afile")} ${L("recFile")}</button></div>`;
    if (state === "file") return `<div class="rec">${orb("on")}<h3>${L("recFinding")}</h3><p>${extra}</p></div>`;
    if (state === "none") return `<div class="rec">${orb("")}<h3>${L("recNone")}</h3><p>${L("recNoneSub")}</p><div class="row2"><button class="btn pri" data-act="recagain">${I("mic")} ${L("recAgain")}</button><button class="btn" data-act="recfile">${I("afile")} ${L("recFile")}</button></div></div>`;
    if (state === "err") return `<div class="rec">${orb("")}<h3>${extra || L("recMicErr")}</h3><p>${extra ? "" : L("recMicErrSub")}</p><div class="row2"><button class="btn pri" data-act="recfile">${I("afile")} ${L("recFile")}</button>${NATIVE ? "" : `<button class="btn" data-act="recbot">${I("send")} ${L("recBot")}</button>`}</div></div>`;
    return "";
  }
  function recSet(html) {
    const sh = $(".sheet");
    if (sh && sh.classList.contains("show")) sh.innerHTML = `<div class="grab"></div>${html}`;
    else openSheet(html, true);
  }
  function recStop(manual) {
    const r = REC;
    r.run++;
    r.active = false;
    r.busy = false;
    try {
      r.node && (r.node.onaudioprocess = null, r.node.disconnect());
    } catch (e) {
    }
    try {
      r.stream && r.stream.getTracks().forEach((t) => t.stop());
    } catch (e) {
    }
    try {
      r.ctx && r.ctx.state !== "closed" && r.ctx.close();
    } catch (e) {
    }
    try {
      r.fileCtx && r.fileCtx.state !== "closed" && r.fileCtx.close();
    } catch (e) {
    }
    r.node = r.stream = r.ctx = r.fileCtx = null;
    r.chunks = [];
    r.len = 0;
    if (manual) recSet(recSheet("none"));
  }
  const recLive = () => REC.active || REC.busy || !!REC.stream || !!REC.ctx || !!REC.fileCtx;
  function recOnHide() {
    if (!recLive()) return;
    recStop();
    if ($(".sheet.show .rec")) recSet(recSheet("none"));
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) recOnHide();
  });
  window.addEventListener("pagehide", recOnHide);
  function recPcm(maxSec) {
    const n = Math.min(REC.len, Math.floor(maxSec * REC.rate)), out = new Float32Array(n);
    let o = n;
    for (let i = REC.chunks.length - 1; i >= 0 && o > 0; i--) {
      const c = REC.chunks[i], take = Math.min(c.length, o);
      out.set(c.subarray(c.length - take), o - take);
      o -= take;
    }
    return out;
  }
  async function recSend(pcmFloat, rate) {
    const sig = window.SCSig.makeSignature(window.SCSig.toSig16k(pcmFloat, rate));
    return api("/recognize", { method: "POST", body: { uri: sig.uri, samplems: sig.samplems } });
  }
  async function recOpen() {
    var _a2, _b2, _c2;
    recStop();
    if (!window.SCSig) return toast(L("err"));
    recSet(recSheet("listen"));
    haptic("light");
    const run = ++REC.run;
    REC.active = true;
    let stream;
    try {
      if (!((_a2 = navigator.mediaDevices) == null ? void 0 : _a2.getUserMedia)) throw new Error("no gum");
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 } });
    } catch (e) {
      if (run === REC.run) {
        REC.active = false;
        recSet(recSheet("err"));
      }
      return;
    }
    if (run !== REC.run || document.hidden) {
      stream.getTracks().forEach((t) => t.stop());
      if (run === REC.run) recOnHide();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC(), src = ctx.createMediaStreamSource(stream), node = ctx.createScriptProcessor(4096, 1, 1), mute = ctx.createGain();
    mute.gain.value = 0;
    Object.assign(REC, { stream, ctx, node, chunks: [], len: 0, rate: ctx.sampleRate });
    node.onaudioprocess = (e) => {
      const d = new Float32Array(e.inputBuffer.getChannelData(0));
      REC.chunks.push(d);
      REC.len += d.length;
    };
    src.connect(node);
    node.connect(mute);
    mute.connect(ctx.destination);
    (_b2 = ctx.resume) == null ? void 0 : _b2.call(ctx);
    const t0 = Date.now(), TOTAL = 13e3;
    const prog = setInterval(() => {
      const p = $("#recprog");
      if (run !== REC.run) return clearInterval(prog);
      if (p) p.style.width = Math.min(100, (Date.now() - t0) / TOTAL * 100) + "%";
    }, 200);
    for (const at of [4.5, 8.5, 12.5]) {
      while (run === REC.run && REC.len < at * REC.rate) {
        await new Promise((r) => setTimeout(r, 200));
        if (Date.now() - t0 > 4e3 && REC.len === 0) break;
      }
      if (run !== REC.run) return;
      if (REC.len === 0) {
        clearInterval(prog);
        recStop();
        return recSet(recSheet("err"));
      }
      try {
        const r = await recSend(recPcm(12), REC.rate);
        if (run !== REC.run) return;
        if (r.hit) {
          clearInterval(prog);
          recStop();
          return recShow(r);
        }
      } catch (e) {
        if (run !== REC.run) return;
        if (e.status === 503) {
          clearInterval(prog);
          recStop();
          return recSet(recSheet("err", L("recBusy")));
        }
      }
    }
    clearInterval(prog);
    if (run === REC.run) {
      recStop();
      recSet(recSheet("none"));
      try {
        (_c2 = tg == null ? void 0 : tg.HapticFeedback) == null ? void 0 : _c2.notificationOccurred("error");
      } catch (e) {
      }
    }
  }
  function recPickFile() {
    recStop();
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "audio/*,video/*,.mp3,.m4a,.ogg,.opus,.wav,.aac,.flac";
    inp.onchange = async () => {
      const f = inp.files && inp.files[0];
      if (!f) return;
      recSet(recSheet("file", esc(f.name)));
      const run = ++REC.run;
      REC.busy = true;
      try {
        const buf = await f.arrayBuffer();
        if (run !== REC.run) return;
        const AC = window.AudioContext || window.webkitAudioContext, ac = new AC();
        REC.fileCtx = ac;
        let ab;
        try {
          ab = await new Promise((res, rej) => {
            const p = ac.decodeAudioData(buf, res, rej);
            if (p && p.then) p.then(res, rej);
          });
        } finally {
          try {
            ac.state !== "closed" && ac.close();
          } catch (e) {
          }
          if (REC.fileCtx === ac) REC.fileCtx = null;
        }
        if (run !== REC.run) return;
        const n = ab.length, rate = ab.sampleRate, W = Math.floor(12 * rate);
        const mono = new Float32Array(Math.min(n, W)), start = n > W ? Math.floor((n - W) / 2) : 0;
        for (let c = 0; c < ab.numberOfChannels; c++) {
          const d = ab.getChannelData(c);
          for (let i = 0; i < mono.length; i++) mono[i] += d[start + i] / ab.numberOfChannels;
        }
        const r = await recSend(mono, rate);
        if (run !== REC.run) return;
        REC.busy = false;
        if (r.hit) return recShow(r);
        recSet(recSheet("none"));
      } catch (e) {
        if (run !== REC.run) return;
        REC.busy = false;
        recSet(recSheet("err", e.status === 503 ? L("recBusy") : e.status ? L("err") : L("recFileErr")));
      }
    };
    inp.click();
  }
  const recActs = (t) => `<div class="racts">
    <button class="btn pri" data-act="play" data-id="${t.id}" data-ctx="rec" data-i="0">${I("play")} ${L("play")}</button>
    ${OFF.ok ? `<button class="btn" data-act="rdl" data-id="${t.id}">${I(OFF.ids.has(t.id) ? "offline" : "download")} ${L("download")}</button>` : ""}
    <button class="btn" data-act="m_queue" data-id="${t.id}">${I("queue")} ${L("recQueue")}</button>
    <button class="btn" data-act="m_addpl" data-id="${t.id}">${I("plus")} ${L("recPl")}</button>
    <button class="btn ic ${S.favs.has(t.id) ? "on" : ""}" data-act="m_fav" data-id="${t.id}" aria-label="${esc(L("fav"))}">${I(S.favs.has(t.id) ? "heart" : "heartO")}</button></div>`;
  function recShow(r) {
    const h = r.hit, all = r.tracks || [];
    const matched = Math.max(0, Math.min(all.length, Number(r.matched) || 0));
    const tracks = all.slice(0, matched);
    remember(tracks);
    hapticOk();
    recHistAdd(h, tracks);
    const ctx = setCtx("rec", tracks), best = tracks[0];
    const q = `${h.artist || ""} ${h.title || ""}`.trim();
    const links = [h.url && [`Shazam`, h.url], h.spotify && ["Spotify", h.spotify], h.apple && ["Apple Music", h.apple]].filter(Boolean);
    recSet(`<div class="rres">
    <div class="rcov">${h.cover ? `<img src="${esc(h.cover)}" alt="">` : I("music")}</div>
    <div class="rmeta"><small>🎯 ${L("recTitle")}</small><h3 dir="auto">${esc(h.title)}</h3><p dir="auto">${esc(h.artist)}</p>
      <span>${[h.album, h.year, h.genre].filter(Boolean).map(esc).join(" · ")}</span>
      <div class="rlinks">${links.map(([n, u]) => `<button class="chip" data-act="recext" data-url="${esc(u)}">${n}</button>`).join("")}</div></div>
  </div>
  ${best ? `<div class="lyo">${L("recBest")}</div>${trackList([best], { ctx })}${recActs(best)}
      ${tracks.length > 1 ? `<div class="lyo">${L("recOnSc")}</div>${trackList(tracks.slice(1, 12), { ctx, start: 1 })}` : ""}` : `<div class="rnone">${I("music")}<b>${L("recNoSc")}</b><span>${L("recNoScSub")}</span><button class="btn" data-act="recsearch" data-q="${esc(q)}">${I("search")} ${L("recSearchSc")}</button></div>`}
  <div class="row2" style="margin-top:12px"><button class="btn" data-act="recagain">${I("mic")} ${L("recAgain")}</button><button class="btn" data-act="rechist">${I("history")} ${L("recHist")}</button></div>`);
  }
  const recHist = () => {
    try {
      const a = JSON.parse(localStorage.getItem("sc_rec_hist") || "[]");
      return Array.isArray(a) ? a : [];
    } catch (e) {
      return [];
    }
  };
  function recHistAdd(h, tracks) {
    const key = `${h.artist}|${h.title}`.toLowerCase();
    const e = {
      at: Date.now(),
      hit: { title: h.title, artist: h.artist, cover: h.cover || null, album: h.album || null, year: h.year || null, url: h.url || null, spotify: h.spotify || null, apple: h.apple || null },
      tracks: tracks.slice(0, 5).map(slimTrack)
    };
    const list = [e, ...recHist().filter((x) => {
      var _a2, _b2;
      return `${(_a2 = x.hit) == null ? void 0 : _a2.artist}|${(_b2 = x.hit) == null ? void 0 : _b2.title}`.toLowerCase() !== key;
    })].slice(0, 30);
    try {
      localStorage.setItem("sc_rec_hist", JSON.stringify(list));
    } catch (e2) {
    }
  }
  function vRecHist() {
    const list = recHist();
    const day = (ts) => {
      try {
        return new Date(ts).toLocaleDateString(lang === "fa" ? "fa-IR" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
      } catch (e) {
        return "";
      }
    };
    root().innerHTML = `<div class="view"><div class="hdr"><div class="logo">🎯 <b>${L("recHist")}</b></div></div>
    <div class="acts"><button class="btn pri" data-act="rec">${I("mic")} ${L("recTitle")}</button>${list.length ? `<button class="btn" data-act="rhclear">${I("trash2")} ${L("recHistClear")}</button>` : ""}</div>
    ${list.length ? list.map((e, k) => {
      const t = e.tracks && e.tracks[0];
      if (t) remember(e.tracks);
      const ctx = t ? setCtx("rh" + k, e.tracks) : "";
      return `<div class="card rhe"><div class="rres"><div class="rcov">${e.hit.cover ? `<img src="${esc(e.hit.cover)}" alt="" loading="lazy">` : I("music")}</div>
        <div class="rmeta"><small>${esc(day(e.at))}</small><h3 dir="auto">${esc(e.hit.title)}</h3><p dir="auto">${esc(e.hit.artist)}</p></div></div>
        ${t ? `${trackList([S.tracks.get(t.id) || t], { ctx })}${recActs(S.tracks.get(t.id) || t).replace('data-ctx="rec"', `data-ctx="${ctx}"`)}` : `<div class="rnone"><b>${L("recNoSc")}</b><button class="btn" data-act="recsearch" data-q="${esc(`${e.hit.artist} ${e.hit.title}`)}">${I("search")} ${L("recSearchSc")}</button></div>`}</div>`;
    }).join("") : emptyBox("history", L("recHistEmpty"), L("recHistSub"))}</div>`;
  }
  function vSearch() {
    const s = S.search;
    root().innerHTML = `<div class="view">
    <div class="sbox"><div class="sinput">${I("search")}<input id="q" type="search" enterkeyhint="search" autocomplete="off" placeholder="${esc(L("searchPh"))}" value="${esc(s.q)}"><button class="mic" data-act="rec" aria-label="${esc(L("recTitle"))}">${I("mic")}</button></div>
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
    var _a2, _b2, _c2, _d2;
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
    if (!s.items.length && !((_b2 = (_a2 = s.lyr) == null ? void 0 : _a2.tracks) == null ? void 0 : _b2.length)) {
      box.innerHTML = emptyBox("music", L("noRes"), L("tryElse"));
      return;
    }
    if (s.type === "tracks" && ((_d2 = (_c2 = s.lyr) == null ? void 0 : _c2.tracks) == null ? void 0 : _d2.length)) {
      const all = s.lyr.tracks.concat(s.items), ctx = setCtx("search", all);
      box.innerHTML = `<div class="lyh">${I("mic")}<div><small>${L("lyFound")}</small><b dir="auto">${esc(s.lyr.title)}</b> — <span dir="auto">${esc(s.lyr.artist)}</span></div></div>` + trackList(s.lyr.tracks, { ctx }) + (s.items.length ? `<div class="lyo">${L("lyOther")}</div>` + trackList(s.items, { ctx, start: s.lyr.tracks.length }) : "");
    } else if (s.type === "tracks") box.innerHTML = trackList(s.items, { ctx: setCtx("search", s.items) });
    else if (s.type === "users") box.innerHTML = `<div class="list">${s.items.map((u) => `<div class="tr ur" data-act="artist" data-id="${u.id}"><div class="art">${img(u.avatar_url, "t120x120")}</div><div class="meta"><div class="t">${esc(u.username)} ${u.verified ? "✅" : ""}</div><div class="a">👥 ${fmtNum(u.followers)} · 🎵 ${u.tracks}${u.city ? " · " + esc(u.city) : ""}</div></div></div>`).join("")}</div>`;
    else box.innerHTML = `<div class="list">${s.items.map((p) => `<div class="tr" data-act="set" data-id="${p.id}"><div class="art">${img(p.artwork_url, "t120x120")}</div><div class="meta"><div class="t">${esc(p.title)}</div><div class="a"><span class="badge">${p.is_album ? L("album") : L("playlist")}</span> ${esc(p.username)} · ${p.track_count} 🎵</div></div></div>`).join("")}</div>`;
    $("#smore").innerHTML = s.more ? `<div class="spin" id="sentinel"></div>` : "";
    if (searchObs) {
      searchObs.disconnect();
      searchObs = null;
    }
    const sen = $("#sentinel");
    if (sen && typeof IntersectionObserver !== "undefined") {
      searchObs = new IntersectionObserver((en) => {
        if (en[0].isIntersecting) doSearch(s.q, false, true);
      });
      searchObs.observe(sen);
    }
  }
  let searchSeq = 0, searchObs = null;
  async function doSearch(q, force = false, more = false) {
    const s = S.search;
    q = (q || "").trim();
    if (more && (s.loading || !s.more || q !== s.q)) return;
    if (!more && q === s.q && !force && s.items.length) return;
    if (/soundcloud\.com|snd\.sc/i.test(q)) return openLink(q);
    const seq = ++searchSeq;
    if (!more) {
      s.q = q;
      s.items = [];
      s.offset = 0;
      s.more = false;
      s.lyr = null;
    }
    if (!q) return drawSearch();
    s.loading = true;
    drawSearch();
    try {
      const r = await api(`/search?type=${s.type}&q=${encodeURIComponent(q)}&offset=${s.offset}`);
      if (seq !== searchSeq) return;
      const items = r.items || [];
      if (s.type === "tracks") remember(items);
      if (!more && r.lyrics) {
        s.lyr = r.lyrics;
        remember(r.lyrics.tracks || []);
      }
      if (more) {
        const seen = new Set(s.items.map((x) => x.id));
        s.items = s.items.concat(items.filter((x) => !seen.has(x.id)));
      } else s.items = items;
      s.offset += items.length;
      s.more = items.length >= 20 && s.offset < 200;
    } catch (e) {
      if (seq === searchSeq) toast(L("err"));
    }
    if (seq !== searchSeq) return;
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
    const xCards = `<button class="pc" data-act="stats"><div class="cv stv">${I("stats")}</div><div class="n">${L("stTitle")}</div><div class="c">${L("st7")}</div></button>
    ${OFF.ok ? `<button class="pc" data-act="dlopen"><div class="cv dlv">${I("download")}</div><div class="n">${L("dlTitle")}</div><div class="c">${dlBusy() ? L("dlProg", DLM.jobs.filter((j) => j.st === "done" || j.st === "skip").length, DLM.jobs.filter((j) => j.st !== "cancel").length) : "&nbsp;"}</div></button>` : ""}
    <button class="pc" data-act="rechist"><div class="cv rhv">${I("history")}</div><div class="n">${L("recHist")}</div><div class="c">${recHist().length || "&nbsp;"}</div></button>`;
    const ofCard0 = `<div class="grid">${OFF.ok ? `<button class="pc" data-act="offopen"><div class="cv off">${I("offline")}</div><div class="n">${L("ofTitle")}</div><div class="c">${L("ofCount", OFF.ids.size, fmtMB(offUsed()))}</div></button>` : ""}${xCards}</div>`;
    try {
      if (S.offline) throw new Error("offline");
      await loadPlaylists();
    } catch (e) {
      $("#pls").innerHTML = ofCard0 + emptyBox("lib", S.offline ? L("ofMode") : L("err"));
      return;
    }
    if (((_a2 = view()) == null ? void 0 : _a2.type) !== "library") return;
    const cards = S.playlists.map((p) => `<button class="pc" data-act="pl" data-id="${p.id}">
      <div class="cv ${p.is_favorites ? "fav" : ""}">${p.is_favorites ? I("heart") : p.cover ? img(p.cover, "t300x300") : I("music")}</div>
      <div class="n">${esc(p.is_favorites ? L("favorites") : p.name)}</div><div class="c">${L("tracksN", p.track_count)}${!p.is_favorites ? ` · ${p.is_public ? "🌐" : "🔒"}` : ""}</div></button>`).join("");
    const ofCard = OFF.ok ? `<button class="pc" data-act="offopen"><div class="cv off">${I("offline")}</div><div class="n">${L("ofTitle")}</div><div class="c">${L("ofCount", OFF.ids.size, fmtMB(offUsed()))}</div></button>` : "";
    $("#pls").innerHTML = `<div class="grid">${ofCard}${cards}${xCards}
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
      ${OFF.ok ? `<button class="btn ic ${tr.every((x) => OFF.ids.has(x.id)) ? "on" : ""}" data-act="pldl" title="${esc(L("ofSave"))}">${I(tr.every((x) => OFF.ids.has(x.id)) ? "offline" : "download")}</button>` : ""}
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
    var _a2, _b2, _c2, _d2, _e2;
    const u0 = ((_a2 = S.me) == null ? void 0 : _a2.user) || {};
    const u = Object.assign({}, u0, { first_name: visName(u0.first_name) ? u0.first_name : u0.username || "" });
    root().innerHTML = `<div class="view">
    <div class="hdr"><div class="av">${u.photo_url ? `<img src="${esc(u.photo_url)}">` : esc((u.first_name || "♪")[0])}</div><div><h1>${esc(u.first_name || "")}</h1><p>${u.username ? "@" + esc(u.username) : ""}</p></div></div>
    <div class="stats"><div><b>${(_b2 = u.downloads) != null ? _b2 : 0}</b><span>${L("downloads")}</span></div><div><b>${Math.max(0, S.playlists.filter((p) => !p.is_favorites).length)}</b><span>${L("playlists")}</span></div><div><b>${S.favs.size || ((_d2 = (_c2 = S.playlists.find((p) => p.is_favorites)) == null ? void 0 : _c2.track_count) != null ? _d2 : 0)}</b><span>${L("favorites")}</span></div></div>
    <div class="card">
      <button class="it" data-act="setlang"><div class="ico" style="background:#4c7dff">${I("globe")}</div><div class="l">${L("lang")}</div><div class="v">${lang === "fa" ? "فارسی 🇮🇷" : "English 🇬🇧"}</div></button>
      <button class="it" data-act="setq"><div class="ico" style="background:#ff8a00">${I("hq")}</div><div class="l">${L("quality")}</div><div class="v">${u.quality === "low" ? L("qLow") : L("qHigh")}</div></button>
      <button class="it" data-act="settheme"><div class="ico" style="background:#8b5cf6">${I("moon")}</div><div class="l">${L("theme")}</div><div class="v">${L(S.theme)}</div></button>
    </div>
    ${OFF.ok ? `<div class="card"><div class="ch">${L("ofSection")}</div>
      <button class="it" data-act="offauto"><div class="ico" style="background:#10b981">${I("offline")}</div><div class="l">${L("ofAuto")}<small>${L("ofNoNet")}</small></div><div class="v"><span class="sw ${OFF.auto ? "on" : ""}"><i></i></span></div></button>
      <button class="it" data-act="offlimit"><div class="ico" style="background:#f59e0b">${I("storage")}</div><div class="l">${L("ofLimit")}</div><div class="v">${OFF.limitMB ? fmtLimit(OFF.limitMB) : L("ofUnlimited")}</div></button>
      <button class="it" data-act="ofq"><div class="ico" style="background:#ff5500">${I("hq")}</div><div class="l">${L("ofQ")}<small>${L("ofQSub")}</small></div><div class="v">${offQ() === "low" ? L("qualLow") : L("qualHigh")}</div></button>
      <button class="it" data-act="favauto"><div class="ico" style="background:#ff2d6f">${I("heart")}</div><div class="l">${L("favAuto")}<small id="favnet">${L("favAutoSub")}</small></div><div class="v"><span class="sw ${favAutoOn() ? "on" : ""}"><i></i></span></div></button>
      <button class="it" data-act="offopen"><div class="ico" style="background:#6366f1">${I("download")}</div><div class="l">${L("ofTitle")}</div><div class="v">${L("ofCount", OFF.ids.size, fmtMB(offUsed()))}</div></button>
      <button class="it" data-act="dlopen"><div class="ico" style="background:#0ea5e9">${I("download")}</div><div class="l">${L("dlTitle")}</div><div class="v">${dlBusy() ? `<span class="badge">${DLM.jobs.filter(dlActive).length}</span>` : ""}</div></button>
      <button class="it" data-act="offclear"><div class="ico" style="background:#ef4444">${I("trash2")}</div><div class="l">${L("ofClear")}</div><div class="v"></div></button></div>` : ""}
    <div class="card"><button class="it" data-act="openbot"><div class="ico" style="background:#2aabee">${I("tg")}</div><div class="l">${L("openBot")}</div><div class="v">@${esc(((_e2 = S.bot) == null ? void 0 : _e2.username) || "")}</div></button>
      ${NATIVE ? "" : `<button class="it" data-act="getapp"><div class="ico" style="background:#22c55e">${I("download")}</div><div class="l">${L("getApp")}</div><div class="v">${I("android", "mini-ic")} ${I("windows", "mini-ic")}</div></button>`}</div>
    ${NATIVE ? `<div class="card">
      <button class="it" data-act="checkupd"><div class="ico" style="background:#0ea5e9">${I(NATIVE.platform === "android" ? "android" : "windows")}</div><div class="l">${L("version")}</div><div class="v">${S.update ? `<span class="badge">${esc(S.update.v)}</span> ` : ""}v${esc(NATIVE.version)}</div></button>
      <button class="it" data-act="logout"><div class="ico" style="background:#ef4444">${I("logout")}</div><div class="l">${L("logout")}</div><div class="v"></div></button></div>` : ""}
    <div class="foot">🎧 SoundCloud ${NATIVE ? `Player v${esc(NATIVE.version)}` : "Mini App"}<br>${L("feat")}</div></div>`;
    netInfo().then((n) => {
      const el = $("#favnet");
      if (el && !n.known) el.textContent = L("favAutoUnknown");
    });
  }
  function openSheet(html, keepRec) {
    if (!keepRec && recLive()) recStop();
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
      sh.addEventListener("pointerdown", qDragStart);
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
    if (S._cf) {
      const f = S._cf;
      S._cf = null;
      f(false);
    }
    if (recLive()) recStop();
    (_a2 = $(".ov")) == null ? void 0 : _a2.classList.remove("show");
    (_b2 = $(".sheet")) == null ? void 0 : _b2.classList.remove("show");
    setTimeout(syncBack, 50);
  }
  function confirmAsk(msg, okLabel) {
    return new Promise((res) => {
      openSheet(`<div class="cfm"><h3>${esc(msg)}</h3><div class="row2"><button class="btn" data-act="cfno">${L("cancel")}</button><button class="btn pri" data-act="cfyes">${esc(okLabel || L("yes"))}</button></div></div>`);
      S._cf = res;
    });
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
    <button class="mi" data-act="m_share" data-id="${t.id}">${I("share")} ${L("share")}</button>
    ${OFF.ok ? OFF.ids.has(t.id) ? `<button class="mi" data-act="m_offdel" data-id="${t.id}">${I("trash2")} ${L("ofRemove")}</button>` : `<button class="mi" data-act="m_offsave" data-id="${t.id}">${I("download")} ${OFF.busy.has(t.id) ? L("ofDl", OFF.busy.get(t.id)) : L("ofSave")}</button>` : ""}
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
  const UNLOCK_SRC = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=";
  const isUnlockSrc = () => (audio.src || "").startsWith("data:audio/wav");
  const isPlaying = () => !audio.paused && !isUnlockSrc();
  function unlockAudio() {
    if (audio.src) return;
    audio.src = UNLOCK_SRC;
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
    let ti = clean.indexOf(target);
    if (ti < 0) ti = Math.max(0, clean.findIndex((t) => t.id === (target == null ? void 0 : target.id)));
    S.queue = clean.map(qEntry);
    S.qi = ti;
    S.orig = null;
    S.failRun = 0;
    if (S.shuffle) shuffleOn();
    loadCurrent();
  }
  const qEntry = (t) => Object.assign({}, t);
  const curEntry = () => S.queue[S.qi];
  function shuffleOn() {
    S.orig = S.queue.slice();
    const cur = curEntry(), rest = S.queue.filter((_, k) => k !== S.qi);
    for (let k = rest.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [rest[k], rest[j]] = [rest[j], rest[k]];
    }
    S.queue = cur ? [cur, ...rest] : rest;
    S.qi = cur ? 0 : -1;
  }
  function shuffleOff() {
    if (S.orig) {
      const cur = curEntry(), have = new Set(S.queue);
      const back2 = S.orig.filter((e) => have.has(e));
      for (const e of S.queue) if (!back2.includes(e)) back2.push(e);
      S.queue = back2;
      S.qi = Math.max(0, S.queue.indexOf(cur));
    }
    S.orig = null;
  }
  function setShuffle(on) {
    if (!!on === !!S.shuffle) return;
    S.shuffle = !!on;
    if (S.queue.length) S.shuffle ? shuffleOn() : shuffleOff();
    persistPlayer(true);
    updatePlayerUI();
    refreshQueue();
  }
  function qInsertNext(t) {
    const e = qEntry(t), cur = curEntry();
    S.queue.splice(S.qi + 1, 0, e);
    if (S.orig) {
      const oi = S.orig.indexOf(cur);
      S.orig.splice(oi + 1, 0, e);
    }
    persistPlayer(true);
    updatePlayerUI();
    refreshQueue();
  }
  function qAppend(t) {
    const e = qEntry(t);
    S.queue.push(e);
    if (S.orig) S.orig.push(e);
    persistPlayer(true);
    updatePlayerUI();
    refreshQueue();
  }
  function qRemove(i) {
    if (i === S.qi || i < 0 || i >= S.queue.length) return false;
    const [e] = S.queue.splice(i, 1);
    if (i < S.qi) S.qi--;
    if (S.orig) {
      const k = S.orig.indexOf(e);
      if (k >= 0) S.orig.splice(k, 1);
    }
    persistPlayer(true);
    updatePlayerUI();
    refreshQueue();
    return true;
  }
  function qMove(from, to) {
    if (from === to || from < 0 || to < 0 || from >= S.queue.length || to >= S.queue.length) return;
    const cur = curEntry();
    const [e] = S.queue.splice(from, 1);
    S.queue.splice(to, 0, e);
    S.qi = S.queue.indexOf(cur);
    persistPlayer(true);
    updatePlayerUI();
    refreshQueue();
  }
  function qMoveNext(i) {
    if (i === S.qi) return;
    qMove(i, i > S.qi ? S.qi + 1 : S.qi);
  }
  function qMoveEnd(i) {
    if (i === S.qi) return;
    qMove(i, S.queue.length - 1);
  }
  function qClear() {
    const cur = curEntry();
    if (!cur) return;
    S.queue = [cur];
    S.qi = 0;
    if (S.orig) S.orig = [cur];
    persistPlayer(true);
    updatePlayerUI();
    refreshQueue();
  }
  function skipUnavailable() {
    S.failRun = (S.failRun || 0) + 1;
    if (S.failRun >= S.queue.length) {
      S.failRun = 0;
      try {
        audio.pause();
      } catch (e) {
      }
      toast(L("qAllFail"));
      return;
    }
    if (S.qi < S.queue.length - 1) S.qi++;
    else if (S.repeat !== "off") S.qi = 0;
    else return;
    toast(L("qSkipped"));
    setTimeout(() => loadCurrent(), 500);
  }
  let loadSeq = 0;
  const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  const OFF = {
    ok: typeof indexedDB !== "undefined",
    db: null,
    ids: /* @__PURE__ */ new Set(),
    meta: /* @__PURE__ */ new Map(),
    busy: /* @__PURE__ */ new Map(),
    arts: /* @__PURE__ */ new Map(),
    auto: localStorage.getItem("sc_off_auto") !== "0",
    limitMB: Number((_d = localStorage.getItem("sc_off_limit")) != null ? _d : 1024)
    // 0 = unlimited
  };
  const LIMITS = [250, 500, 1024, 2048, 5120, 0];
  const fmtLimit = (mb) => mb >= 1024 ? `${mb / 1024} GB` : `${mb} MB`;
  function offDb() {
    if (OFF.db) return Promise.resolve(OFF.db);
    return new Promise((res, rej) => {
      const r = indexedDB.open("sc_offline", 2);
      r.onupgradeneeded = () => {
        const d = r.result;
        if (!d.objectStoreNames.contains("audio")) d.createObjectStore("audio");
        if (!d.objectStoreNames.contains("meta")) d.createObjectStore("meta", { keyPath: "id" });
        if (!d.objectStoreNames.contains("lyrics")) d.createObjectStore("lyrics");
      };
      r.onblocked = () => console.warn("offline db upgrade blocked");
      r.onsuccess = () => {
        OFF.db = r.result;
        res(OFF.db);
      };
      r.onerror = () => rej(r.error);
    });
  }
  function offTx(store, mode, fn) {
    return offDb().then((d) => new Promise((res, rej) => {
      const tx = d.transaction(store, mode);
      const st = tx.objectStore(store);
      let out;
      const r = fn(st);
      if (r) r.onsuccess = () => {
        out = r.result;
      };
      tx.oncomplete = () => res(out);
      tx.onerror = () => rej(tx.error);
      tx.onabort = () => rej(tx.error);
    }));
  }
  function offTxAll(stores, fn) {
    return offDb().then((d) => new Promise((res, rej) => {
      const tx = d.transaction(stores, "readwrite");
      try {
        fn(Object.fromEntries(stores.map((n) => [n, tx.objectStore(n)])));
      } catch (e) {
        try {
          tx.abort();
        } catch (e2) {
        }
        return rej(e);
      }
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
      tx.onabort = () => rej(tx.error || new Error("aborted"));
    }));
  }
  async function offInit() {
    var _a2, _b2;
    if (!OFF.ok) return;
    try {
      const all = await offTx("meta", "readonly", (st) => st.getAll()) || [];
      for (const m of all) {
        OFF.meta.set(m.id, m);
        OFF.ids.add(m.id);
      }
      (_b2 = (_a2 = navigator.storage) == null ? void 0 : _a2.persist) == null ? void 0 : _b2.call(_a2).catch(() => {
      });
    } catch (e) {
      console.warn("offline db unavailable", e);
      OFF.ok = false;
    }
  }
  const offUsed = () => {
    let n = 0;
    for (const m of OFF.meta.values()) n += m.size || 0;
    return n;
  };
  const offGet = (id) => offTx("audio", "readonly", (st) => st.get(id)).catch(() => null);
  function offArt(m) {
    if (!(m == null ? void 0 : m.art)) return (m == null ? void 0 : m.artwork_url) || "";
    if (!OFF.arts.has(m.id)) OFF.arts.set(m.id, URL.createObjectURL(m.art));
    return OFF.arts.get(m.id);
  }
  async function offPut(t, blob, pinned) {
    let artBlob = null;
    if (t.artwork_url && !/^blob:/.test(t.artwork_url)) {
      try {
        const r = await fetch(art(t.artwork_url, "t300x300"));
        if (r.ok) artBlob = await r.blob();
      } catch (e) {
      }
    }
    const ly = await lyFetchForSave(t);
    const m = {
      id: t.id,
      title: t.title,
      artist: t.artist,
      username: t.username,
      user_id: t.user_id,
      permalink_url: t.permalink_url,
      artwork_url: t.artwork_url,
      duration_ms: t.duration_ms,
      genre: t.genre,
      size: blob.size,
      mime: blob.type,
      saved: Date.now(),
      last: Date.now(),
      pinned: !!pinned,
      art: artBlob
    };
    await offTxAll(["audio", "meta", "lyrics"], (st) => {
      st.audio.put(blob, t.id);
      st.meta.put(m);
      if (ly) st.lyrics.put(ly, t.id);
    });
    OFF.meta.set(t.id, m);
    OFF.ids.add(t.id);
    await offEvict(t.id);
    refreshOfflineUI();
  }
  async function offDel(id) {
    await offTxAll(["audio", "meta", "lyrics"], (st) => {
      st.audio.delete(id);
      st.meta.delete(id);
      st.lyrics.delete(id);
    }).catch(() => {
    });
    OFF.meta.delete(id);
    OFF.ids.delete(id);
    if (OFF.arts.has(id)) {
      URL.revokeObjectURL(OFF.arts.get(id));
      OFF.arts.delete(id);
    }
  }
  async function offClear() {
    await offTxAll(["audio", "meta", "lyrics"], (st) => {
      st.audio.clear();
      st.meta.clear();
      st.lyrics.clear();
    });
    for (const u of OFF.arts.values()) URL.revokeObjectURL(u);
    OFF.meta.clear();
    OFF.ids.clear();
    OFF.arts.clear();
  }
  let touchT;
  function offTouch(id) {
    const m = OFF.meta.get(id);
    if (!m) return;
    m.last = Date.now();
    clearTimeout(touchT);
    touchT = setTimeout(() => offTx("meta", "readwrite", (st) => st.put(m)).catch(() => {
    }), 1500);
  }
  async function offEvict(keep) {
    if (!OFF.limitMB) return;
    const max = OFF.limitMB * 1048576;
    let used = offUsed(), removed = 0;
    if (used <= max) return;
    const order = [...OFF.meta.values()].filter((m) => m.id !== keep).sort((a, b) => a.pinned - b.pinned || (a.last || 0) - (b.last || 0));
    for (const m of order) {
      if (used <= max) break;
      await offDel(m.id);
      used -= m.size || 0;
      removed++;
    }
    if (removed) toast(L("ofFull"));
  }
  function refreshOfflineUI() {
    updatePlayerUI();
    const v = view();
    if (v && (v.type === "offline" || v.type === "library" || v.type === "settings")) render();
    else document.querySelectorAll(".tr[data-id]").forEach((el) => {
      const id = Number(el.dataset.id), a = el.querySelector(".a");
      if (a && OFF.ids.has(id) && !a.querySelector(".offi")) a.insertAdjacentHTML("afterbegin", `<span class="offi">${I("offline")}</span>`);
    });
  }
  function nextOfflineIndex() {
    var _a2;
    for (let k = 1; k <= S.queue.length; k++) {
      const j = (S.qi + k) % S.queue.length;
      if (OFF.ids.has((_a2 = S.queue[j]) == null ? void 0 : _a2.id)) return j;
    }
    return -1;
  }
  let curObjUrl = null;
  function setAudioSrc(src, isBlob) {
    if (curObjUrl && curObjUrl !== src) {
      URL.revokeObjectURL(curObjUrl);
      curObjUrl = null;
    }
    if (isBlob) curObjUrl = src;
    audio.src = src;
  }
  let CAP = null;
  const CAP_MAX_BYTES = 80 * 1048576;
  function newCapture(t, kind) {
    CAP = { t, kind: kind || "hls-aac", init: null, frags: /* @__PURE__ */ new Map(), bytes: 0, total: 0, urls: null, done: false };
    return CAP;
  }
  function dropCapture(cap) {
    if (!cap) return;
    cap.done = true;
    cap.frags.clear();
    cap.init = null;
    cap.bytes = 0;
  }
  function capLimit() {
    const lim = OFF.limitMB ? OFF.limitMB * 1048576 : Infinity;
    return Math.min(CAP_MAX_BYTES, lim);
  }
  function captureLoader(cap) {
    const Base = window.Hls.DefaultConfig.loader;
    return class extends Base {
      load(ctx, cfg, cb) {
        const ok = cb.onSuccess;
        cb.onSuccess = (resp, st, c, nd) => {
          try {
            const f = c && c.frag;
            if (f && resp && resp.data instanceof ArrayBuffer && CAP === cap && !cap.done) {
              if (f.sn === "initSegment") cap.init = resp.data.slice(0);
              else if (!cap.frags.has(f.sn)) {
                cap.frags.set(f.sn, resp.data.slice(0));
                cap.bytes += resp.data.byteLength;
              }
              if (cap.bytes > capLimit()) {
                dropCapture(cap);
                if (CAP === cap) CAP = null;
              } else checkCapture(cap);
            }
          } catch (e) {
            console.warn("capture", e);
          }
          ok(resp, st, c, nd);
        };
        super.load(ctx, cfg, cb);
      }
    };
  }
  function checkCapture(cap) {
    if (cap.done || !cap.total || cap.frags.size < cap.total) return;
    if (cap.kind === "hls-aac" && !cap.init) return;
    cap.done = true;
    saveCapture(cap);
  }
  async function saveCapture(cap) {
    try {
      if (OFF.ids.has(cap.t.id)) return;
      const segs = [...cap.frags.keys()].sort((a, b) => a - b).map((k) => new Uint8Array(cap.frags.get(k)));
      const blob = await buildAudio(cap.kind, cap.init && new Uint8Array(cap.init), segs, cap.t);
      if (blob) await offPut(cap.t, blob, false);
    } catch (e) {
      console.warn("offline save failed", e);
    } finally {
      cap.frags.clear();
      cap.init = null;
      cap.bytes = 0;
    }
  }
  function finishCapture() {
    const cap = CAP;
    CAP = null;
    if (!cap || cap.done) return;
    if (!cap.urls || !cap.total || !navigator.onLine) return dropCapture(cap);
    const missing = cap.urls.filter((u) => !cap.frags.has(u.sn));
    if (missing.length > cap.total * 0.35 || cap.kind === "hls-aac" && !cap.init) return dropCapture(cap);
    cap.done = true;
    (async () => {
      try {
        for (const m of missing) {
          const r = await fetchT(m.url, SEG_TIMEOUT);
          if (!r.ok) throw new Error("seg " + r.status);
          const b = await r.arrayBuffer();
          cap.frags.set(m.sn, b);
          cap.bytes += b.byteLength;
          if (cap.bytes > capLimit()) throw new Error("capture too large");
        }
        await saveCapture(cap);
      } catch (e) {
        console.warn("complete capture failed", e);
        dropCapture(cap);
      }
    })();
  }
  async function buildAudio(kind, init, segs, t) {
    if (kind === "hls-aac") {
      if (!window.SCRemux || !init) return null;
      return new Blob([window.SCRemux.remuxFmp4ToM4a(init, segs, { title: t.title, artist: t.artist })], { type: "audio/mp4" });
    }
    return new Blob(segs, { type: "audio/mpeg" });
  }
  const SEG_TIMEOUT = 3e4, FILE_TIMEOUT = 18e4;
  function fetchT(url, ms, outer) {
    if (typeof AbortController === "undefined") {
      return Promise.race([fetch(url), new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error("timeout"), { timeout: true })), ms))]);
    }
    const c = new AbortController();
    const tm = setTimeout(() => c.abort(), ms);
    const onOuter = () => c.abort();
    if (outer) {
      if (outer.aborted) c.abort();
      else outer.addEventListener("abort", onOuter, { once: true });
    }
    return fetch(url, { signal: c.signal }).catch((e) => {
      throw (outer == null ? void 0 : outer.aborted) ? Object.assign(new Error("canceled"), { canceled: true }) : Object.assign(e, { timeout: e.name === "AbortError" });
    }).finally(() => {
      var _a2;
      clearTimeout(tm);
      (_a2 = outer == null ? void 0 : outer.removeEventListener) == null ? void 0 : _a2.call(outer, "abort", onOuter);
    });
  }
  const QKBPS = { high: 162, low: 97 };
  const offQ = () => localStorage.getItem("sc_off_q") === "low" ? "low" : "high";
  const offEstimate = (t, q) => Math.round((t.duration_ms || 0) / 1e3 * (QKBPS[q] || QKBPS.high) * 125);
  const optBytes = (o, t) => o.bytes || Math.round((t.duration_ms || 0) / 1e3 * (o.kbps || QKBPS.high) * 125);
  const pickOpt = (opts, q) => q === "low" ? opts[opts.length - 1] : opts[0];
  const offLimitBytes = () => OFF.limitMB ? OFF.limitMB * 1048576 : Infinity;
  function offCancel(id) {
    var _a2;
    const c = (_a2 = OFF.ctrl) == null ? void 0 : _a2.get(id);
    if (!c) return false;
    try {
      c.abort();
    } catch (e) {
    }
    return true;
  }
  async function offDownload(t, quiet, outerSignal, opt = {}) {
    if (!OFF.ok || OFF.ids.has(t.id) || OFF.busy.has(t.id)) return OFF.ids.has(t.id);
    if (offEstimate(t, opt.q || (opt.preset && /96|64|low/.test(opt.preset) ? "low" : "high")) > offLimitBytes()) {
      opt.err = "big";
      if (!quiet) toast(L("ofTooBig", fmtLimit(OFF.limitMB)));
      return false;
    }
    OFF.ctrl = OFF.ctrl || /* @__PURE__ */ new Map();
    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : { signal: { aborted: false, addEventListener() {
    }, removeEventListener() {
    } }, abort() {
      this.signal.aborted = true;
    } };
    if (outerSignal) {
      if (outerSignal.aborted) ctrl.abort();
      else outerSignal.addEventListener("abort", () => ctrl.abort(), { once: true });
    }
    const sig = ctrl.signal;
    const check = () => {
      if (sig.aborted) throw Object.assign(new Error("canceled"), { canceled: true });
    };
    OFF.ctrl.set(t.id, ctrl);
    OFF.busy.set(t.id, 0);
    updatePlayerUI();
    const prog = (p) => {
      var _a2;
      OFF.busy.set(t.id, Math.min(99, Math.round(p * 100)));
      try {
        opt.onProg && opt.onProg(Math.min(0.99, p));
      } catch (e) {
      }
      if (((_a2 = S.queue[S.qi]) == null ? void 0 : _a2.id) === t.id) updatePlayerUI();
    };
    const get = async (u, ms) => {
      check();
      const r = await fetchT(u, ms, sig);
      if (!r.ok) throw new Error("http " + r.status);
      return r;
    };
    try {
      let preset2 = opt.preset;
      if (!preset2 && opt.q) {
        const o = await api(`/stream/${t.id}/options`);
        check();
        if (o.track) Object.assign(t, o.track);
        const pick = o.options && o.options.length ? pickOpt(o.options, opt.q) : null;
        if (!pick) throw Object.assign(new Error("no option"), { status: 404 });
        if (optBytes(pick, t) > offLimitBytes()) throw Object.assign(new Error("too big"), { tooBig: true });
        preset2 = pick.preset;
      }
      const s = await api(`/stream/${t.id}${preset2 ? `?preset=${encodeURIComponent(preset2)}` : ""}`);
      check();
      if (s.track) Object.assign(t, s.track);
      if (offEstimate(t, /96|64/.test(s.preset || "") ? "low" : "high") > offLimitBytes()) throw Object.assign(new Error("too big"), { tooBig: true });
      let blob;
      if (s.kind === "progressive") {
        const r = await get(s.url, FILE_TIMEOUT);
        const len = Number(r.headers.get("content-length") || 0);
        if (len > offLimitBytes()) throw Object.assign(new Error("too big"), { tooBig: true });
        if (r.body && r.body.getReader && len) {
          const rd = r.body.getReader(), parts = [];
          let got = 0;
          for (; ; ) {
            const { done, value } = await rd.read();
            if (done) break;
            check();
            parts.push(value);
            got += value.length;
            if (got > offLimitBytes()) throw Object.assign(new Error("too big"), { tooBig: true });
            prog(got / len);
          }
          blob = new Blob(parts, { type: "audio/mpeg" });
        } else blob = new Blob([await r.arrayBuffer()], { type: "audio/mpeg" });
      } else {
        let url = s.url, txt = await (await get(url, SEG_TIMEOUT)).text();
        const variant = txt.split("\n").find((l) => l.trim() && !l.startsWith("#") && /EXT-X-STREAM-INF/.test(txt));
        if (variant) {
          url = new URL(variant.trim(), url).href;
          txt = await (await get(url, SEG_TIMEOUT)).text();
        }
        const mapM = txt.match(/#EXT-X-MAP:URI="([^"]+)"/);
        const segUrls = txt.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#")).map((l) => new URL(l, url).href);
        const init = mapM ? new Uint8Array(await (await get(new URL(mapM[1], url).href, SEG_TIMEOUT)).arrayBuffer()) : null;
        const segs = new Array(segUrls.length);
        let done = 0, i = 0, bytes = 0;
        const worker = async () => {
          while (i < segUrls.length) {
            const k = i++;
            const b = new Uint8Array(await (await get(segUrls[k], SEG_TIMEOUT)).arrayBuffer());
            check();
            segs[k] = b;
            bytes += b.length;
            if (bytes > offLimitBytes()) throw Object.assign(new Error("too big"), { tooBig: true });
            prog(++done / segUrls.length);
          }
        };
        try {
          await Promise.all([worker(), worker(), worker()]);
        } catch (e) {
          i = segUrls.length;
          ctrl.abort();
          throw e;
        }
        check();
        blob = await buildAudio(init ? "hls-aac" : "hls-mp3", init, segs, t);
      }
      if (!blob) throw new Error("unsupported");
      check();
      await offPut(t, blob, true);
      if (!quiet) {
        toast(L("ofSaved"));
        hapticOk();
      }
      return true;
    } catch (e) {
      if (e.canceled || sig.aborted) {
        opt.err = "cancel";
        if (!quiet) toast(L("ofCanceled"));
        return false;
      }
      console.warn("offline download failed", e);
      opt.err = e.tooBig ? "big" : e.status === 451 || e.status === 402 ? "drm" : e.status === 404 && preset ? "q" : "net";
      if (!quiet) toast(e.tooBig ? L("ofTooBig", fmtLimit(OFF.limitMB)) : e.status === 451 ? L("drm") : L("err"));
      return false;
    } finally {
      if (OFF.ctrl.get(t.id) === ctrl) OFF.ctrl.delete(t.id);
      OFF.busy.delete(t.id);
      updatePlayerUI();
    }
  }
  const DLM = { jobs: [], running: false, cur: null };
  const mkCtrl = () => typeof AbortController !== "undefined" ? new AbortController() : { signal: { aborted: false, addEventListener() {
  }, removeEventListener() {
  } }, abort() {
    this.signal.aborted = true;
  } };
  const dlActive = (j) => j.st === "queued" || j.st === "run";
  const dlJob = (id) => DLM.jobs.find((j) => j.t.id === id && dlActive(j));
  const dlBusy = () => DLM.jobs.some(dlActive);
  function dlEnqueue(list, o = {}) {
    let n = 0;
    DLM.jobs = DLM.jobs.filter((j) => dlActive(j) || !list.some((t) => t && t.id === j.t.id));
    for (const t of list) {
      if (!t || !t.id || t.drm || t.snipped) continue;
      if (OFF.ids.has(t.id)) {
        if (!o.auto) DLM.jobs.push({ t, st: "skip", pct: 100 });
        continue;
      }
      if (dlJob(t.id) || OFF.busy.has(t.id)) continue;
      DLM.jobs.push({ t: Object.assign({}, t), st: "queued", pct: 0, preset: o.preset, q: o.q || (o.preset ? null : offQ()), auto: !!o.auto });
      n++;
    }
    dlRefresh();
    dlRun();
    return n;
  }
  async function dlRun() {
    var _a2, _b2;
    if (DLM.running) return;
    DLM.running = true;
    let okN = 0, failN = 0;
    try {
      for (; ; ) {
        const j = DLM.jobs.find((x) => x.st === "queued");
        if (!j) break;
        if (j.auto && !await autoNetOk()) {
          for (const x of DLM.jobs) if (x.auto && x.st === "queued") x.st = "cancel";
          toast(L("dlNet"));
          break;
        }
        if (OFF.ids.has(j.t.id)) {
          j.st = "skip";
          j.pct = 100;
          continue;
        }
        j.st = "run";
        j.pct = 0;
        j.ctrl = mkCtrl();
        DLM.cur = j;
        dlRefresh();
        const o = { preset: j.preset, q: j.q, onProg: (p) => {
          j.pct = Math.round(p * 100);
          dlRefresh();
        } };
        let ok = false;
        try {
          ok = await offDownload(j.t, true, j.ctrl.signal, o);
        } catch (e) {
          console.warn("dl job", e);
        }
        j.st = ok ? "done" : j.ctrl.signal.aborted ? "cancel" : "fail";
        j.err = ok ? null : o.err;
        if (ok) j.pct = 100;
        j.ctrl = null;
        DLM.cur = null;
        dlRefresh();
        if (ok) okN++;
        else if (j.st === "fail") failN++;
        if (ok && ((_a2 = S.queue[S.qi]) == null ? void 0 : _a2.id) === j.t.id) updatePlayerUI();
      }
    } finally {
      DLM.running = false;
      DLM.cur = null;
      dlRefresh();
    }
    if ((okN || failN) && !dlBusy() && ((_b2 = view()) == null ? void 0 : _b2.type) !== "downloads") {
      toast(okN ? L("ofAllDone", okN) + (failN ? ` · ${L("dlFail")}: ${failN}` : "") : `${L("dlFail")}: ${failN}`);
      if (okN) hapticOk();
    }
  }
  function dlCancel(id) {
    const j = dlJob(id);
    if (!j) return false;
    if (j.st === "queued") j.st = "cancel";
    else if (j.ctrl) j.ctrl.abort();
    dlRefresh();
    return true;
  }
  function dlCancelAll() {
    let n = 0;
    for (const j of DLM.jobs) {
      if (j.st === "queued") {
        j.st = "cancel";
        n++;
      } else if (j.st === "run" && j.ctrl) {
        j.ctrl.abort();
        n++;
      }
    }
    dlRefresh();
    return n;
  }
  function dlRetry(id) {
    for (const j of DLM.jobs) if ((j.st === "fail" || j.st === "cancel") && (id == null ? j.st === "fail" : j.t.id === id)) {
      j.st = "queued";
      j.pct = 0;
      if (j.err === "q") {
        j.preset = null;
        j.q = j.q || offQ();
      }
      j.err = null;
    }
    dlRefresh();
    dlRun();
  }
  const dlClearDone = () => {
    DLM.jobs = DLM.jobs.filter(dlActive);
    dlRefresh();
  };
  function dlBadge(id) {
    const j = [...DLM.jobs].reverse().find((x) => x.t.id === id);
    if (!j || OFF.ids.has(id) && j.st !== "run") return "";
    if (j.st === "queued") return `<span class="dls q">${I("download")}${L("dlQueued")}</span>`;
    if (j.st === "run") return `<span class="dls r">${I("download")}${j.pct}%</span>`;
    if (j.st === "fail") return `<span class="dls f">${I("close")}${L("dlFail")}</span>`;
    return "";
  }
  let dlRefT = null;
  function dlRefresh() {
    if (dlRefT) return;
    dlRefT = setTimeout(() => {
      var _a2, _b2;
      dlRefT = null;
      if (((_a2 = view()) == null ? void 0 : _a2.type) === "downloads") drawDownloads();
      document.querySelectorAll("#view .tr[data-id]:not(.dlj), .sheet .tr[data-id]:not(.dlj)").forEach((el) => {
        const id = Number(el.dataset.id), a = el.querySelector(".a");
        if (!a) return;
        const old = a.querySelector(".dls"), html = dlBadge(id);
        if (old) old.remove();
        if (html) a.insertAdjacentHTML("afterbegin", html);
        if (OFF.ids.has(id) && !a.querySelector(".offi")) a.insertAdjacentHTML("afterbegin", `<span class="offi">${I("offline")}</span>`);
      });
      const pb = $("#view [data-act=pldl]"), v = view();
      if (pb && ((_b2 = v == null ? void 0 : v.data) == null ? void 0 : _b2.tracks)) {
        const all = v.data.tracks.every((x) => OFF.ids.has(x.id));
        pb.classList.toggle("on", all);
        pb.innerHTML = I(all ? "offline" : "download");
      }
      const fo = $("#fpoff");
      if (fo) updatePlayerUI();
    }, 300);
  }
  async function roomCheck(need) {
    const queued = DLM.jobs.filter(dlActive).reduce((a, j) => a + offEstimate(j.t, j.q), 0);
    if (OFF.limitMB) {
      let pinned = 0;
      for (const m of OFF.meta.values()) if (m.pinned) pinned += m.size || 0;
      const free = OFF.limitMB * 1048576 - pinned - queued;
      if (need > free) return L("dlNoRoomLimit", fmtMB(need), fmtMB(Math.max(0, free)));
    }
    try {
      const e = navigator.storage && navigator.storage.estimate ? await navigator.storage.estimate() : null;
      if (e && e.quota) {
        const free = e.quota - (e.usage || 0) - queued;
        if (need * 1.1 > free) return L("dlNoRoomDisk", fmtMB(need), fmtMB(Math.max(0, free)));
      }
    } catch (e) {
    }
    return null;
  }
  async function dlSheet(t) {
    if (!t) return;
    if (OFF.ids.has(t.id)) return toast(L("ofSaved"));
    if (dlJob(t.id)) return go({ type: "downloads" });
    if (S.offline || navigator.onLine === false) return toast(L("ofMode"));
    const head = `<h3>${L("qualTitle")}</h3><div class="sh"><div class="art">${img(t.artwork_url, "t120x120")}</div><div><div class="t" dir="auto">${esc(t.title)}</div><div class="a" dir="auto">${esc(t.artist)} · ${fmtDur(t.duration_ms)}</div></div></div>`;
    openSheet(`<div class="dlq" data-tid="${t.id}">${head}<div class="lyo">${L("qualLoading")}</div><div class="spin"></div></div>`);
    let r, msg = null;
    try {
      r = await api(`/stream/${t.id}/options`);
    } catch (e) {
      msg = e.status === 451 || e.status === 402 ? L("drm") : e.status === 404 ? L("qualNone") : L("err");
    }
    const box = $(`.sheet.show .dlq[data-tid="${t.id}"]`);
    if (!box) return;
    if (r == null ? void 0 : r.track) {
      Object.assign(t, r.track);
      remember([r.track]);
    }
    const opts = (r == null ? void 0 : r.options) || [];
    if (!msg && !opts.length) msg = L("qualNone");
    if (msg) {
      box.innerHTML = `${head}${emptyBox("download", msg)}`;
      return;
    }
    const def = pickOpt(opts, offQ());
    S.dlOpts = { t, opts };
    box.innerHTML = `${head}${opts.map((o, i) => `<button class="mi dlopt ${o === def ? "on" : ""}" data-act="dlpick" data-i="${i}">${I(o.kbps >= 128 ? "hq" : "download")}
      <span class="dlol"><b>${o.kbps >= 128 ? L("qualHigh") : L("qualLow")}</b><small dir="ltr">${esc(String(o.codec || "").toUpperCase())} · ${o.kbps} kbps</small></span>
      <span class="dlos">${o === def ? `<span class="badge">${L("qualDefault")}</span> ` : ""}${L("qualApprox", fmtMB(optBytes(o, t)))}</span></button>`).join("")}
    <div class="lyo">${L("dlBatchSub")}</div>`;
  }
  async function dlPick(i) {
    const d = S.dlOpts;
    if (!d) return;
    const o = d.opts[i];
    if (!o) return;
    const why = await roomCheck(optBytes(o, d.t));
    if (why) {
      closeSheet();
      return toastLong(why);
    }
    closeSheet();
    S.dlOpts = null;
    if (dlEnqueue([d.t], { preset: o.preset })) toast(L("dlStarted", 1));
  }
  function dlBatchSheet(list) {
    const todo = list.filter((x) => x && !OFF.ids.has(x.id) && !x.drm && !x.snipped && !dlJob(x.id));
    if (!todo.length) return toast(L("ofAllHave"));
    const sz = (q) => todo.reduce((a, x) => a + offEstimate(x, q), 0), have = list.filter((x) => OFF.ids.has(x.id)).length;
    S.dlBatch = todo;
    S.dlBatchAll = list;
    openSheet(`<h3>${L("dlBatchQ", todo.length)}</h3>
    ${["high", "low"].map((q) => `<button class="mi dlopt ${offQ() === q ? "on" : ""}" data-act="dlbatch" data-q="${q}">${I(q === "high" ? "hq" : "download")}
      <span class="dlol"><b>${q === "high" ? L("qualHigh") : L("qualLow")}</b><small dir="ltr">AAC · ~${QKBPS[q]} kbps</small></span>
      <span class="dlos">${offQ() === q ? `<span class="badge">${L("qualDefault")}</span> ` : ""}${L("qualApprox", fmtMB(sz(q)))}</span></button>`).join("")}
    <div class="lyo">${L("dlBatchSub")}${have ? ` · ${L("dlSkip")}: ${have}` : ""}</div>`);
  }
  async function dlBatchGo(q) {
    const todo = S.dlBatch || [], all = S.dlBatchAll || todo;
    S.dlBatch = S.dlBatchAll = null;
    const why = await roomCheck(todo.reduce((a, x) => a + offEstimate(x, q), 0));
    closeSheet();
    if (why) return toastLong(why);
    const n = dlEnqueue(all, { q });
    if (n) {
      toast(L("dlStarted", n));
      hapticOk();
    }
  }
  function toastLong(msg) {
    toast(msg);
    clearTimeout(toastT);
    toastT = setTimeout(() => {
      var _a2;
      return (_a2 = $(".toast")) == null ? void 0 : _a2.classList.remove("show");
    }, 6500);
  }
  function vDownloads() {
    root().innerHTML = `<div class="view"><div class="hdr"><div class="logo">📥 <b>${L("dlTitle")}</b></div></div><div id="dlbox"></div></div>`;
    drawDownloads();
  }
  function drawDownloads() {
    const box = $("#dlbox");
    if (!box) return;
    const jobs = DLM.jobs;
    if (!jobs.length) {
      box.innerHTML = emptyBox("download", L("dlNone"), L("dlNoneSub"));
      return;
    }
    const tot = jobs.filter((j) => j.st !== "cancel").length, fin = jobs.filter((j) => j.st === "done" || j.st === "skip").length;
    const pct = tot ? Math.round((fin + (DLM.cur ? DLM.cur.pct / 100 : 0)) / tot * 100) : 0;
    const fails = jobs.filter((j) => j.st === "fail").length, busy = dlBusy();
    const stTxt = (j) => j.st === "run" ? `${j.pct}%` : j.st === "queued" ? L("dlQueued") : j.st === "done" ? L("dlDone") : j.st === "skip" ? L("dlSkip") : j.st === "cancel" ? L("dlCanceled") : `${L("dlFail")}${j.err === "drm" ? " · " + L("dlErrDrm") : j.err === "big" ? " · " + L("dlErrBig") : j.err === "q" ? " · " + L("dlErrQ") : ""}`;
    box.innerHTML = `<div class="card dlsum"><div class="dlrow"><b>${L("dlProg", fin, tot)}</b><span>${pct}%</span></div><div class="upd-bar"><i style="width:${pct}%"></i></div>
      <div class="row2">${busy ? `<button class="btn" data-act="dlcancelall">${I("close")} ${L("dlCancelAll")}</button>` : ""}${fails ? `<button class="btn pri" data-act="dlretry">${I("retry")} ${L("dlRetry")}</button>` : ""}${!busy ? `<button class="btn" data-act="dlclear">${I("trash2")} ${L("dlClearDone")}</button>` : ""}</div></div>
    <div class="list">${jobs.map((j) => `<div class="tr dlj ${j.st}" data-id="${j.t.id}"><div class="art">${img(j.t.artwork_url, "t120x120")}</div>
      <div class="meta"><div class="t" dir="auto">${esc(j.t.title)}</div><div class="a"><span class="dlst">${stTxt(j)}</span> · <span dir="auto">${esc(j.t.artist || "")}</span></div>
        ${j.st === "run" ? `<div class="dlp"><i style="width:${j.pct}%"></i></div>` : ""}</div>
      ${dlActive(j) ? `<button class="more" data-act="dlcancel" data-id="${j.t.id}" aria-label="${esc(L("dlCancel"))}">${I("close")}</button>` : j.st === "fail" || j.st === "cancel" ? `<button class="more" data-act="dlretryone" data-id="${j.t.id}" aria-label="${esc(L("retry"))}">${I("retry")}</button>` : j.st === "done" || j.st === "skip" ? `<span class="more on">${I("offline")}</span>` : ""}</div>`).join("")}</div>`;
  }
  const favAutoOn = () => localStorage.getItem("sc_off_favauto") === "1";
  let netCache = null;
  async function netInfo() {
    if (netCache && Date.now() - netCache.at < 5e3) return netCache;
    let r = { known: false, ok: false, type: "unknown" };
    try {
      if (NATIVE && NATIVE.netInfo) {
        let x = NATIVE.netInfo();
        if (x && x.then) x = await x;
        if (typeof x === "string") x = JSON.parse(x);
        if (x && x.known) r = { known: true, ok: !!x.ok, type: x.type || "?" };
      }
    } catch (e) {
    }
    if (!r.known) {
      const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (c && c.type && c.type !== "unknown" && c.type !== "other" && c.type !== "mixed") r = { known: true, ok: (c.type === "wifi" || c.type === "ethernet") && !c.saveData, type: c.type };
    }
    if (navigator.onLine === false) r = { known: true, ok: false, type: "none" };
    r.at = Date.now();
    netCache = r;
    return r;
  }
  async function autoNetOk() {
    netCache = null;
    const n = await netInfo();
    if (n.known) return n.ok;
    return S.favAsk === "yes" && navigator.onLine !== false;
  }
  let favAutoBusy = false;
  async function favAutoRun(why) {
    if (!favAutoOn() || !OFF.ok || S.offline || favAutoBusy) return;
    favAutoBusy = true;
    netCache = null;
    try {
      const favs = (S.favList || []).filter((t) => t && S.favs.has(t.id) && !OFF.ids.has(t.id) && !t.drm && !t.snipped && !dlJob(t.id));
      if (!favs.length) return;
      const n = await netInfo();
      if (n.known && !n.ok) return;
      if (!n.known) {
        if (S.favAsk === "no") return;
        if (S.favAsk !== "yes") {
          if ($(".sheet.show")) return;
          const yes = await confirmAsk(L("favAutoAsk", favs.length), L("download"));
          S.favAsk = yes ? "yes" : "no";
          if (!yes) return;
        }
      }
      const why2 = await roomCheck(favs.reduce((a, x) => a + offEstimate(x, offQ()), 0));
      if (why2) {
        if (why === "toggle") toastLong(why2);
        return;
      }
      const k = dlEnqueue(favs, { auto: true, q: offQ() });
      if (k) toast(L("favAutoStart", k));
    } finally {
      favAutoBusy = false;
    }
  }
  try {
    (_f = (_e = navigator.connection || {}).addEventListener) == null ? void 0 : _f.call(_e, "change", () => {
      netCache = null;
      favAutoRun("net");
    });
  } catch (e) {
  }
  window.addEventListener("online", () => {
    netCache = null;
    setTimeout(() => favAutoRun("online"), 3e3);
  });
  function offTracks() {
    return [...OFF.meta.values()].sort((a, b) => (b.last || 0) - (a.last || 0)).map((m) => ({
      id: m.id,
      title: m.title,
      artist: m.artist,
      username: m.username,
      user_id: m.user_id,
      permalink_url: m.permalink_url,
      artwork_url: offArt(m),
      duration_ms: m.duration_ms,
      genre: m.genre
    }));
  }
  function vOffline() {
    var _a2;
    const list = offTracks();
    remember(list);
    const total = list.reduce((a, x) => a + (x.duration_ms || 0), 0);
    root().innerHTML = `<div class="view">
    <div class="ph"><div class="bgimg" style="background-image:url('${esc(((_a2 = list[0]) == null ? void 0 : _a2.artwork_url) || PH)}')"></div>
      <div class="in"><div class="cover off">${I("offline")}</div>
      <div class="info"><div class="kind">${L("ofNoNet")}</div><h1>${L("ofTitle")}</h1><div class="sub">${L("ofCount", list.length, fmtMB(offUsed()))} · ${fmtDur(total)}</div></div></div></div>
    ${list.length ? `<div class="acts"><button class="btn pri" data-act="offplay">${I("play")} ${L("ofPlayAll")}</button>
      <button class="btn ic" data-act="offshuffle">${I("shuffle")}</button></div>
      ${trackList(list, { ctx: setCtx("off", list) })}` : emptyBox("offline", L("ofEmpty"), L("ofEmptySub"))}</div>`;
  }
  const PLAYER_KEY = "sc_player";
  const RECOVER = /(^|[#&?])recover=1/.test(location.hash + location.search);
  if (RECOVER) {
    try {
      history.replaceState(null, "", location.pathname);
    } catch (e) {
    }
  }
  const slimTrack = (t) => {
    var _a2;
    return {
      id: t.id,
      title: t.title,
      artist: t.artist,
      username: t.username,
      user_id: t.user_id,
      permalink_url: t.permalink_url,
      artwork_url: /^blob:/.test(t.artwork_url || "") ? ((_a2 = OFF.meta.get(t.id)) == null ? void 0 : _a2.artwork_url) || null : t.artwork_url || null,
      duration_ms: t.duration_ms,
      genre: t.genre,
      drm: !!t.drm,
      snipped: !!t.snipped
    };
  };
  let persistAt = 0, persistTimer = null;
  function writePlayer() {
    persistAt = Date.now();
    clearTimeout(persistTimer);
    persistTimer = null;
    try {
      if (!S.queue.length || S.qi < 0) {
        localStorage.removeItem(PLAYER_KEY);
        return;
      }
      const start = Math.max(0, Math.min(S.qi - 200, S.queue.length - 400));
      const cur = S.queue[S.qi];
      const pos = S.needLoad || isUnlockSrc() ? S.pendingSeek || 0 : audio.currentTime || 0;
      const part = S.queue.slice(start, start + 400), at = new Map(part.map((e, i) => [e, i]));
      const orig = S.orig ? S.orig.map((e) => at.get(e)).filter((i) => i !== void 0) : null;
      localStorage.setItem(PLAYER_KEY, JSON.stringify({
        v: 2,
        queue: part.map(slimTrack),
        qi: S.qi - start,
        orig,
        id: cur == null ? void 0 : cur.id,
        pos: Math.floor(pos * 10) / 10,
        playing: !S.needLoad && isPlaying(),
        shuffle: !!S.shuffle,
        repeat: S.repeat,
        ts: Date.now()
      }));
    } catch (e) {
      console.warn("persist player", e);
    }
  }
  function persistPlayer(now) {
    if (now) return writePlayer();
    if (persistTimer) return;
    persistTimer = setTimeout(writePlayer, Math.max(0, persistAt + 2e3 - Date.now()));
  }
  function readSavedPlayer() {
    var _a2;
    try {
      const d = JSON.parse(localStorage.getItem(PLAYER_KEY) || "null");
      if (d && Array.isArray(d.queue) && d.queue.length && d.qi >= 0 && d.qi < d.queue.length && ((_a2 = d.queue[d.qi]) == null ? void 0 : _a2.id)) return d;
    } catch (e) {
    }
    return null;
  }
  function restorePlayer() {
    if (S.queue.length) return false;
    const d = readSavedPlayer();
    if (!d) return false;
    const all = d.queue.map((t) => t && t.id ? qEntry(t) : null);
    S.queue = all.filter(Boolean);
    S.qi = all[d.qi] && all[d.qi].id === d.id ? S.queue.indexOf(all[d.qi]) : Math.max(0, S.queue.findIndex((t) => t.id === d.id));
    remember(d.queue.filter((t) => t && t.id));
    S.shuffle = !!d.shuffle;
    S.repeat = ["off", "all", "one"].includes(d.repeat) ? d.repeat : "off";
    S.orig = null;
    if (S.shuffle && Array.isArray(d.orig)) {
      const o = d.orig.map((i) => all[i]).filter(Boolean), seen = new Set(o);
      for (const e of S.queue) if (!seen.has(e)) o.push(e);
      S.orig = o;
    }
    S.pendingSeek = Math.max(0, Number(d.pos) || 0);
    S.pendingSeekId = S.queue[S.qi].id;
    if (RECOVER && d.playing) {
      S.needLoad = false;
      loadCurrent(true);
    } else {
      S.needLoad = true;
      updatePlayerUI();
      updateProgress();
    }
    return true;
  }
  function playNow() {
    if (S.needLoad) {
      S.needLoad = false;
      return loadCurrent(true);
    }
    return audio.play().catch(() => {
    });
  }
  audio.addEventListener("loadedmetadata", () => {
    var _a2;
    if (isUnlockSrc() || !S.pendingSeek || ((_a2 = S.queue[S.qi]) == null ? void 0 : _a2.id) !== S.pendingSeekId) return;
    const p = S.pendingSeek;
    S.pendingSeek = 0;
    S.pendingSeekId = null;
    if (isFinite(audio.duration) && p < audio.duration - 1) {
      try {
        audio.currentTime = p;
      } catch (e) {
      }
    }
  });
  ["pause", "play", "seeked"].forEach((ev) => audio.addEventListener(ev, () => persistPlayer(true)));
  audio.addEventListener("timeupdate", () => persistPlayer());
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) persistPlayer(true);
  });
  async function loadCurrent(autoplay = true) {
    var _a2;
    const t = S.queue[S.qi];
    if (!t) return;
    S.needLoad = false;
    plStart(t);
    if (S.pendingSeekId && S.pendingSeekId !== t.id) {
      S.pendingSeek = 0;
      S.pendingSeekId = null;
    }
    persistPlayer(true);
    const seq = ++loadSeq;
    S.loadingTrack = true;
    updatePlayerUI();
    highlightRows();
    try {
      const blob = OFF.ids.has(t.id) ? await offGet(t.id) : null;
      if (seq !== loadSeq) return;
      if (blob) {
        finishCapture();
        if (hls) {
          hls.destroy();
          hls = null;
        }
        setAudioSrc(URL.createObjectURL(blob), true);
        offTouch(t.id);
        if (autoplay) await audio.play().catch((e) => console.warn("play blocked", e));
        setMediaSession(t);
        pushNative();
        return;
      }
      if (S.offline || navigator.onLine === false) {
        const e = new Error("offline");
        e.offline = true;
        throw e;
      }
      const s = await api(`/stream/${t.id}`);
      if (seq !== loadSeq) return;
      if (s.track) {
        Object.assign(t, s.track);
        remember([s.track]);
      }
      finishCapture();
      if (hls) {
        hls.destroy();
        hls = null;
      }
      const isHls = /\.m3u8/i.test(s.url) || ((_a2 = s.kind) == null ? void 0 : _a2.startsWith("hls"));
      const nativeHls = !!audio.canPlayType("application/vnd.apple.mpegurl");
      if (isHls && window.Hls && window.Hls.isSupported() && !(IS_IOS && nativeHls)) {
        const cap = OFF.ok && OFF.auto ? newCapture(t, s.kind) : null;
        hls = new window.Hls(Object.assign({ enableWorker: true, maxBufferLength: 30 }, cap ? { fLoader: captureLoader(cap) } : {}));
        if (cap) hls.on(window.Hls.Events.LEVEL_LOADED, (_, d) => {
          cap.urls = d.details.fragments.map((f) => ({ sn: f.sn, url: f.url }));
          cap.total = cap.urls.length;
          checkCapture(cap);
        });
        hls.loadSource(s.url);
        hls.attachMedia(audio);
        hls.on(window.Hls.Events.ERROR, (_, d) => {
          if (d.fatal && seq === loadSeq) {
            console.warn("hls fatal", d);
            skipUnavailable();
          }
        });
      } else {
        setAudioSrc(s.url, false);
      }
      if (autoplay) await audio.play().catch((e) => console.warn("play blocked", e));
      setMediaSession(t);
      pushNative();
    } catch (e) {
      if (seq !== loadSeq) return;
      toast(e.offline ? L("ofNot") : e.status === 451 ? L("drm") : L("err"));
      if (e.offline) {
        const j = nextOfflineIndex();
        if (j >= 0 && j !== S.qi) {
          S.qi = j;
          setTimeout(() => loadCurrent(), 400);
        }
        return;
      }
      if (S.queue.length > 1) skipUnavailable();
    } finally {
      if (seq === loadSeq) {
        S.loadingTrack = false;
        updatePlayerUI();
      }
    }
  }
  function toggle() {
    if (!S.queue.length) return;
    S.needLoad || audio.paused ? playNow() : audio.pause();
    haptic();
  }
  function next(auto = false) {
    if (!S.queue.length) return;
    if (auto && S.repeat === "one") {
      plEnd();
      plStart(S.queue[S.qi]);
      audio.currentTime = 0;
      audio.play().catch(() => {
      });
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
  audio.addEventListener("ended", () => {
    if (isUnlockSrc()) return;
    plEnd();
    rsSave("ended");
    if (SL.eot) return sleepFire();
    next(true);
  });
  audio.addEventListener("playing", () => {
    S.failRun = 0;
  });
  let srcRetrySeq = -1;
  audio.addEventListener("error", () => {
    const t = curEntry(), code = audio.error && audio.error.code;
    if (!t || S.needLoad || hls || isUnlockSrc() || !audio.currentSrc || code === 1) return;
    console.warn("audio error", code, t.id);
    const fromDevice = !!curObjUrl && audio.currentSrc === curObjUrl;
    if (!fromDevice && srcRetrySeq !== loadSeq && !S.offline && navigator.onLine !== false) {
      S.pendingSeek = audio.currentTime || S.pendingSeek || 0;
      S.pendingSeekId = t.id;
      srcRetrySeq = loadSeq + 1;
      return loadCurrent(!audio.paused || S.loadingTrack);
    }
    if (S.loadingTrack) {
      S.loadingTrack = false;
      updatePlayerUI();
    }
    if (S.queue.length > 1) skipUnavailable();
    else {
      toast(L("err"));
      try {
        audio.pause();
      } catch (e) {
      }
    }
  });
  const DEVICE_ID = (() => {
    let d = "";
    try {
      d = localStorage.getItem("sc_device_id") || "";
    } catch (e) {
    }
    if (!/^[\w-]{8,64}$/.test(d)) {
      const a = new Uint8Array(12);
      (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => {
        a[i] = Math.random() * 256;
      });
      d = "d-" + [...a].map((x) => x.toString(16).padStart(2, "0")).join("");
      try {
        localStorage.setItem("sc_device_id", d);
      } catch (e) {
      }
    }
    return d;
  })();
  const DEVICE_NAME = NATIVE ? NATIVE.platform === "android" ? "Android" : NATIVE.platform === "windows" ? "Windows" : "App" : "Telegram";
  const RS = { skew: 0, lastSave: 0, flushing: false, checkedAt: 0, lastTrack: null, shown: null };
  const rsLocal = () => {
    try {
      return JSON.parse(localStorage.getItem("sc_resume") || "null");
    } catch (e) {
      return null;
    }
  };
  function rsSave(reason) {
    const t = curEntry();
    if (!t || isUnlockSrc() || S.needLoad || !audio.src) return;
    if (reason === "pause" && (S.loadingTrack || audio.ended)) return;
    const dur = audio.duration && isFinite(audio.duration) ? audio.duration * 1e3 : t.duration_ms || 0;
    const pos = reason === "ended" ? dur : (audio.currentTime || 0) * 1e3;
    const st = {
      track_id: t.id,
      track: slimTrack(t),
      position_ms: Math.max(0, Math.floor(pos)),
      duration_ms: Math.floor(dur) || null,
      ended: reason === "ended",
      device_id: DEVICE_ID,
      device: DEVICE_NAME,
      updated_at: Date.now() + RS.skew,
      pending: true
    };
    try {
      localStorage.setItem("sc_resume", JSON.stringify(st));
    } catch (e) {
    }
    RS.lastSave = Date.now();
    rsFlush();
  }
  async function rsFlush() {
    const st = rsLocal();
    if (!st || !st.pending || RS.flushing || S.offline || navigator.onLine === false || !(appToken || initData)) return;
    RS.flushing = true;
    try {
      const body = Object.assign({}, st);
      delete body.pending;
      const r = await api("/resume", { method: "POST", body });
      if (r.server_time) RS.skew = r.server_time - Date.now();
      const cur = rsLocal();
      if (cur && cur.updated_at === st.updated_at) {
        cur.pending = false;
        localStorage.setItem("sc_resume", JSON.stringify(cur));
      }
    } catch (e) {
      if (e.status === 400) {
        const cur = rsLocal();
        if (cur && cur.updated_at === st.updated_at) {
          cur.pending = false;
          localStorage.setItem("sc_resume", JSON.stringify(cur));
        }
      }
    } finally {
      RS.flushing = false;
    }
  }
  async function rsCheck(force) {
    if (!S.me || S.offline || navigator.onLine === false || document.body.classList.contains("auth")) return;
    if (!force && Date.now() - RS.checkedAt < 2e4) return;
    RS.checkedAt = Date.now();
    await rsFlush();
    let r;
    try {
      r = await api("/resume");
    } catch (e) {
      return;
    }
    if (r.server_time) RS.skew = r.server_time - Date.now();
    const st = r.state;
    if (!st || !st.track_id || st.device_id === DEVICE_ID) return rsHide();
    const mine = rsLocal();
    if (mine && mine.updated_at >= st.updated_at) return rsHide();
    if (!(st.position_ms > 3e3 || st.ended) || !isFinite(st.position_ms)) return rsHide();
    if (localStorage.getItem("sc_resume_seen") === String(st.updated_at)) return;
    rsShow(st);
  }
  const rsNearEnd = (st) => st.ended || st.duration_ms > 0 && st.position_ms / st.duration_ms > 0.95;
  function rsShow(st) {
    RS.shown = st;
    const t = Object.assign({ id: st.track_id, title: "", artist: "" }, st.track || {}, { id: st.track_id });
    let el = $(".rsm");
    if (!el) {
      el = document.createElement("div");
      el.className = "rsm";
      document.body.appendChild(el);
      el.addEventListener("click", onClick);
    }
    const end = rsNearEnd(st);
    el.innerHTML = `<div class="art" data-act="rsgo">${img(t.artwork_url, "t120x120")}</div>
    <div class="meta" data-act="rsgo"><small>${esc(L("rsFrom", st.device || ""))}</small><b>${end ? L("rsStart") : L("rsAt", fmtDur(st.position_ms))}</b><span dir="auto">${esc(t.title)}${t.artist ? " — " + esc(t.artist) : ""}</span></div>
    <button class="btn pri" data-act="rsgo">${I("play")} ${end ? L("play") : L("rsGo")}</button><button class="b" data-act="rsx" aria-label="close">${I("close")}</button>`;
    requestAnimationFrame(() => el.classList.add("show"));
  }
  function rsHide(seen) {
    var _a2;
    if (seen && RS.shown) try {
      localStorage.setItem("sc_resume_seen", String(RS.shown.updated_at));
    } catch (e) {
    }
    (_a2 = $(".rsm")) == null ? void 0 : _a2.classList.remove("show");
  }
  function rsGo() {
    const st = RS.shown;
    if (!st) return;
    rsHide(true);
    RS.shown = null;
    const t = remember([Object.assign({}, st.track || {}, { id: st.track_id })])[0] && S.tracks.get(st.track_id);
    if (!t) return;
    S.pendingSeek = rsNearEnd(st) ? 0 : st.position_ms / 1e3;
    S.pendingSeekId = t.id;
    playList([t], 0);
  }
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      rsFlush();
      rsCheck();
    } else rsFlush();
  });
  window.addEventListener("online", () => {
    setTimeout(() => {
      rsFlush();
      rsCheck(true);
    }, 1500);
  });
  audio.addEventListener("pause", () => rsSave("pause"));
  audio.addEventListener("playing", () => {
    const t = curEntry();
    if (t && !isUnlockSrc() && RS.lastTrack !== t) {
      RS.lastTrack = t;
      rsSave("track");
    }
  });
  audio.addEventListener("timeupdate", () => {
    if (isPlaying() && Date.now() - RS.lastSave >= 15e3) rsSave("tick");
  });
  const isCounted = (p) => !!p && (p.ms >= 3e4 || p.dur > 0 && p.ms > p.dur / 2);
  const PL = { cur: null, lastCt: null, ckAt: 0, db: null };
  function stDb() {
    if (PL.db) return Promise.resolve(PL.db);
    return new Promise((res, rej) => {
      if (typeof indexedDB === "undefined") return rej(new Error("no idb"));
      const r = indexedDB.open("sc_stats", 1);
      r.onupgradeneeded = () => {
        const d = r.result;
        if (!d.objectStoreNames.contains("plays")) d.createObjectStore("plays", { keyPath: "k", autoIncrement: true }).createIndex("at", "at");
      };
      r.onsuccess = () => {
        PL.db = r.result;
        res(PL.db);
      };
      r.onerror = () => rej(r.error);
    });
  }
  const stTx = (mode, fn) => stDb().then((d) => new Promise((res, rej) => {
    const tx = d.transaction("plays", mode), st = tx.objectStore("plays");
    let out;
    const q = fn(st);
    if (q) q.onsuccess = () => {
      out = q.result;
    };
    tx.oncomplete = () => res(out);
    tx.onerror = () => rej(tx.error);
    tx.onabort = () => rej(tx.error);
  }));
  function plCommit(p) {
    if (!isCounted(p)) return Promise.resolve(false);
    const rec = { id: p.id, title: p.title, artist: p.artist, artwork_url: p.artwork_url, dur: p.dur, ms: Math.round(p.ms), at: p.at };
    return stTx("readwrite", (st) => st.add(rec)).then(() => true).catch((e) => {
      console.warn("stats", e);
      return false;
    });
  }
  function plStart(t) {
    if (PL.cur && t && PL.cur.id === t.id && PL.cur.recovered) {
      PL.cur.recovered = false;
      PL.lastCt = null;
      return;
    }
    plEnd();
    if (!t) return;
    const s = slimTrack(t);
    PL.cur = { id: t.id, title: t.title || "", artist: t.artist || "", artwork_url: s.artwork_url, dur: t.duration_ms || 0, ms: 0, at: Date.now() };
    PL.lastCt = null;
  }
  function plEnd() {
    const p = PL.cur;
    PL.cur = null;
    PL.lastCt = null;
    try {
      localStorage.removeItem("sc_play_cur");
    } catch (e) {
    }
    if (p) plCommit(p);
  }
  audio.addEventListener("timeupdate", () => {
    var _a2;
    const ct = audio.currentTime || 0, p = PL.cur;
    if (!p || isUnlockSrc() || audio.paused || ((_a2 = curEntry()) == null ? void 0 : _a2.id) !== p.id) {
      PL.lastCt = ct;
      return;
    }
    if (PL.lastCt != null) {
      const d = ct - PL.lastCt;
      if (d > 0 && d < 3) p.ms += d * 1e3;
    }
    PL.lastCt = ct;
    if (!p.dur && isFinite(audio.duration)) p.dur = Math.round(audio.duration * 1e3);
    if (Date.now() - PL.ckAt > 1e4) {
      PL.ckAt = Date.now();
      try {
        localStorage.setItem("sc_play_cur", JSON.stringify(p));
      } catch (e) {
      }
    }
  });
  ["pause", "seeking"].forEach((ev) => audio.addEventListener(ev, () => {
    PL.lastCt = null;
    if (PL.cur) try {
      localStorage.setItem("sc_play_cur", JSON.stringify(PL.cur));
    } catch (e) {
    }
  }));
  (function plRecover() {
    let p = null;
    try {
      p = JSON.parse(localStorage.getItem("sc_play_cur") || "null");
    } catch (e) {
    }
    if (!p || !p.id) return;
    const saved = readSavedPlayer();
    if (RECOVER && saved && saved.id === p.id) {
      PL.cur = Object.assign(p, { recovered: true });
      return;
    }
    localStorage.removeItem("sc_play_cur");
    plCommit(p);
  })();
  async function stLoad() {
    try {
      return await stTx("readonly", (st) => st.getAll()) || [];
    } catch (e) {
      return [];
    }
  }
  function stCompute(all, days) {
    const from = days ? Date.now() - days * 864e5 : 0;
    const rows = all.filter((r) => r.at >= from && isCounted(r));
    const ms = rows.reduce((a, r) => a + (r.ms || 0), 0);
    const art2 = /* @__PURE__ */ new Map(), trk = /* @__PURE__ */ new Map();
    for (const r of rows) {
      const an = (r.artist || "").trim() || "—";
      const a = art2.get(an) || { name: an, n: 0, ms: 0 };
      a.n++;
      a.ms += r.ms || 0;
      art2.set(an, a);
      const t = trk.get(r.id) || { id: r.id, title: r.title, artist: r.artist, artwork_url: r.artwork_url, duration_ms: r.dur, n: 0, ms: 0 };
      t.n++;
      t.ms += r.ms || 0;
      trk.set(r.id, t);
    }
    const by = (a, b) => b.n - a.n || b.ms - a.ms;
    return { plays: rows.length, minutes: Math.round(ms / 6e4), tracks: trk.size, artists: [...art2.values()].sort(by).slice(0, 5), top: [...trk.values()].sort(by).slice(0, 5) };
  }
  async function vStats(v) {
    v.range = v.range || "7";
    root().innerHTML = `<div class="view"><div class="hdr"><div class="logo">📊 <b>${L("stTitle")}</b></div></div><div id="stbox"><div class="spin"></div></div></div>`;
    const all = await stLoad();
    if (view() !== v) return;
    const days = v.range === "all" ? 0 : Number(v.range), c = stCompute(all, days);
    S.stLast = { c, label: v.range === "7" ? L("st7") : v.range === "30" ? L("st30") : L("stAll") };
    const box = $("#stbox");
    if (!box) return;
    const chips = `<div class="seg" style="margin:0 0 12px">${[["7", "st7"], ["30", "st30"], ["all", "stAll"]].map(([k, s]) => `<button class="chip ${v.range === k ? "on" : ""}" data-act="strange" data-r="${k}">${L(s)}</button>`).join("")}</div>`;
    if (!c.plays) {
      box.innerHTML = chips + emptyBox("stats", L("stEmpty"), L("stEmptySub")) + `<div class="lyo">${L("stRule")}</div>`;
      return;
    }
    const top = c.top.map((t) => Object.assign({}, t));
    remember(top.map((t) => S.tracks.get(t.id) ? Object.assign({}, S.tracks.get(t.id), { artwork_url: S.tracks.get(t.id).artwork_url || t.artwork_url }) : t));
    const ctx = setCtx("stats", top.map((t) => S.tracks.get(t.id) || t));
    box.innerHTML = `${chips}
    <div class="stc"><small>${esc(S.stLast.label)}</small>
      <div class="stn"><div><b>${c.minutes.toLocaleString(lang === "fa" ? "fa-IR" : "en-US")}</b><span>${L("stMinutes")}</span></div>
      <div><b>${c.plays.toLocaleString(lang === "fa" ? "fa-IR" : "en-US")}</b><span>${L("stPlays")}</span></div>
      <div><b>${c.tracks.toLocaleString(lang === "fa" ? "fa-IR" : "en-US")}</b><span>${L("stTracks")}</span></div></div>
      ${c.artists[0] ? `<div class="stfav">🎤 <span dir="auto">${esc(c.artists[0].name)}</span></div>` : ""}</div>
    <div class="h2"><h2>🎤 ${L("stTopArtists")}</h2></div>
    <div class="card">${c.artists.map((a, i) => `<div class="it"><div class="stk">${i + 1}</div><div class="l" dir="auto">${esc(a.name)}</div><div class="v">${L("stPlaysN", a.n)} · ${L("stMinN", Math.round(a.ms / 6e4))}</div></div>`).join("")}</div>
    <div class="h2"><h2>🎵 ${L("stTopTracks")}</h2></div>
    <div class="list">${top.map((t, i) => `<div class="tr" data-act="play" data-id="${t.id}" data-ctx="${ctx}" data-i="${i}"><div class="num">${i + 1}</div><div class="art">${img(t.artwork_url, "t120x120")}</div>
      <div class="meta"><div class="t" dir="auto">${esc(t.title)}</div><div class="a"><span dir="auto">${esc(t.artist || "")}</span> · ${L("stPlaysN", t.n)}</div></div></div>`).join("")}</div>
    <div class="row2" style="margin-top:14px"><button class="btn pri" data-act="stshare">${I("share")} ${L("stShare")}</button><button class="btn" data-act="stclear">${I("trash2")} ${L("stClear")}</button></div>
    <div class="lyo">${L("stRule")}</div>`;
  }
  function stShare() {
    var _a2, _b2;
    const d = S.stLast;
    if (!d || !d.c.plays) return;
    const c = d.c, n = (x) => x.toLocaleString(lang === "fa" ? "fa-IR" : "en-US");
    const text = L("stCard", d.label, n(c.minutes), n(c.tracks), (_a2 = c.artists[0]) == null ? void 0 : _a2.name, c.top[0] ? `${c.top[0].title} — ${c.top[0].artist}` : "");
    if (NATIVE) return nativeShare(APP_LINK, text);
    return shareLink(`https://t.me/${((_b2 = S.bot) == null ? void 0 : _b2.username) || "SoundClouddl_RoBot"}`, text);
  }
  const LY = { mem: /* @__PURE__ */ new Map(), id: null, d: null, open: false, cur: -1, manualAt: 0, req: 0 };
  const lyDir = (s) => {
    const r = (String(s).match(/[\u0590-\u08ff\ufb1d-\ufefc]/g) || []).length, l = (String(s).match(/[A-Za-z\u00c0-\u024f\u0400-\u04ff]/g) || []).length;
    return r > l ? "rtl" : l ? "ltr" : "auto";
  };
  const lyKeep = (d) => d && (d.status === "synced" || d.status === "plain" || d.status === "none");
  async function lyFetchForSave(t) {
    try {
      let d = LY.mem.get(t.id);
      if (!d) d = await Promise.race([api(`/lyrics/${t.id}`), new Promise((r) => setTimeout(() => r(null), 9e3))]);
      if (lyKeep(d)) {
        LY.mem.set(t.id, d);
        return d;
      }
    } catch (e) {
    }
    return null;
  }
  async function lyLoad(t) {
    if (LY.mem.has(t.id)) return LY.mem.get(t.id);
    let d = null;
    if (OFF.ok && OFF.ids.has(t.id)) d = await offTx("lyrics", "readonly", (st) => st.get(t.id)).catch(() => null);
    if (!d) {
      if (S.offline || navigator.onLine === false) return { status: "offline" };
      try {
        d = await api(`/lyrics/${t.id}`);
      } catch (e) {
        return { status: "error" };
      }
      if (lyKeep(d) && OFF.ok && OFF.ids.has(t.id)) offTxAll(["meta", "lyrics"], (st) => {
        const q = st.meta.get(t.id);
        q.onsuccess = () => {
          if (q.result) st.lyrics.put(d, t.id);
        };
      }).catch(() => {
      });
    }
    if (lyKeep(d)) LY.mem.set(t.id, d);
    return d || { status: "error" };
  }
  function lyToggle(on) {
    var _a2, _b2;
    LY.open = on == null ? !LY.open : !!on;
    (_a2 = $(".fp")) == null ? void 0 : _a2.classList.toggle("ly", LY.open);
    (_b2 = $("#tly")) == null ? void 0 : _b2.classList.toggle("on", LY.open);
    if (LY.open) lyRender();
  }
  async function lyRender() {
    var _a2, _b2;
    const t = curEntry(), box = $("#lyp");
    if (!t || !box) return;
    if (LY.id === t.id && LY.d && LY.d.status !== "error" && LY.d.status !== "offline") return lyTick(true);
    LY.id = t.id;
    LY.d = null;
    LY.cur = -1;
    const req = ++LY.req;
    box.innerHTML = `<div class="spin"></div>`;
    const d = await lyLoad(t);
    if (req !== LY.req || ((_a2 = curEntry()) == null ? void 0 : _a2.id) !== t.id) return;
    LY.d = d;
    const src = d.match ? `<div class="lysrc" dir="auto">${esc(L("lySrc", d.match.artist, d.match.title))}</div>` : "";
    if (d.status === "synced" && ((_b2 = d.lines) == null ? void 0 : _b2.length)) {
      box.innerHTML = `<div class="lyl">${d.lines.map((l, i) => `<p class="ll" data-act="lyseek" data-t="${l.t}" data-i="${i}" dir="${lyDir(l.text)}">${l.text ? esc(l.text) : "♪"}</p>`).join("")}</div>${src}`;
    } else if ((d.status === "synced" || d.status === "plain") && d.text) {
      box.innerHTML = `<div class="lyt" dir="${lyDir(d.text)}">${esc(d.text)}</div>${src}`;
    } else {
      const msg = d.status === "offline" ? L("lyOffline") : d.status === "error" ? L("lyErr") : L("lyNone");
      box.innerHTML = `<div class="lyn">${I("lyrics")}<h3>${msg}</h3>${d.instrumental ? `<p>${L("lyInstr")}</p>` : ""}</div>`;
    }
    box.scrollTop = 0;
    lyTick(true);
  }
  function lyTick(force) {
    if (!LY.open || !LY.d || LY.d.status !== "synced" || !LY.d.lines) return;
    const box = $("#lyp"), ls = box && box.querySelectorAll(".ll");
    if (!ls || !ls.length) return;
    const ms = (S.needLoad ? S.pendingSeek || 0 : audio.currentTime || 0) * 1e3 + 150;
    let k = -1;
    const lines = LY.d.lines;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].t <= ms) k = i;
      else break;
    }
    if (k === LY.cur && !force) return;
    if (LY.cur >= 0 && ls[LY.cur]) ls[LY.cur].classList.remove("on");
    LY.cur = k;
    if (k >= 0 && ls[k]) {
      ls[k].classList.add("on");
      if (Date.now() - LY.manualAt > 4e3) {
        const el = ls[k], top = Math.max(0, box.scrollTop + el.getBoundingClientRect().top - box.getBoundingClientRect().top - box.clientHeight / 2 + el.offsetHeight / 2);
        try {
          box.scrollTo({ top, behavior: force ? "auto" : "smooth" });
        } catch (e) {
          box.scrollTop = top;
        }
      }
    }
  }
  function lySeek(ms) {
    var _a2;
    if (S.needLoad) {
      S.pendingSeek = ms / 1e3;
      S.pendingSeekId = (_a2 = curEntry()) == null ? void 0 : _a2.id;
      updateProgress();
      persistPlayer(true);
      return lyTick(true);
    }
    try {
      audio.currentTime = ms / 1e3;
    } catch (e) {
    }
    LY.manualAt = 0;
    lyTick(true);
  }
  audio.addEventListener("timeupdate", () => lyTick());
  audio.addEventListener("seeked", () => lyTick(true));
  const SL = { end: 0, eot: false, iv: null, vol: 1 };
  const SL_MIN = [5, 10, 15, 30, 45, 60];
  function fadeTo(v) {
    v = Math.max(0, Math.min(1, v));
    if (Math.abs(SL.vol - v) < 0.01) return;
    SL.vol = v;
    if (EQ.fade) {
      try {
        EQ.fade.gain.setTargetAtTime(v, EQ.ctx.currentTime, 0.1);
      } catch (e) {
        EQ.fade.gain.value = v;
      }
    } else {
      try {
        audio.volume = v;
      } catch (e) {
      }
    }
  }
  const fadeReset = () => {
    SL.vol = -1;
    fadeTo(1);
  };
  function sleepSet(m) {
    sleepClear(true);
    if (m === "eot") SL.eot = true;
    else {
      SL.end = Date.now() + m * 6e4;
      SL.iv = setInterval(sleepTick, 500);
    }
    toast(m === "eot" ? L("slSetEnd") : L("slSet", L("slMin", m)));
    toolsUI();
  }
  function sleepClear(silent) {
    clearInterval(SL.iv);
    SL.iv = null;
    SL.end = 0;
    SL.eot = false;
    fadeReset();
    if (!silent) toast(L("slCanceled"));
    toolsUI();
  }
  function sleepLeft() {
    return SL.end ? Math.max(0, SL.end - Date.now()) : SL.eot ? Math.max(0, ((audio.duration || 0) - (audio.currentTime || 0)) * 1e3) : 0;
  }
  function sleepTick() {
    if (!SL.end && !SL.eot) return;
    const left = sleepLeft();
    if (SL.end && left <= 0) return sleepFire();
    if (isPlaying()) fadeTo(left <= 15e3 && (SL.end || SL.eot && isFinite(audio.duration)) ? left / 15e3 : 1);
    const lbl = $("#tslv");
    if (lbl) lbl.textContent = SL.eot ? "⏹" : fmtDur(left);
    const sl = $("#slleft");
    if (sl) sl.textContent = L("slLeft", SL.eot ? L("slEnd") : fmtDur(left));
  }
  function sleepFire() {
    clearInterval(SL.iv);
    SL.iv = null;
    SL.end = 0;
    SL.eot = false;
    try {
      audio.pause();
    } catch (e) {
    }
    setTimeout(fadeReset, 250);
    toast(L("slStopped"));
    toolsUI();
    pushNative();
  }
  audio.addEventListener("timeupdate", () => {
    if (SL.end || SL.eot) sleepTick();
  });
  audio.addEventListener("pause", () => {
    if (SL.vol < 1) fadeReset();
  });
  function sleepSheet() {
    const on = SL.end || SL.eot;
    openSheet(`<h3>🌙 ${L("slTitle")}</h3>${on ? `<div class="sll" id="slleft">${L("slLeft", SL.eot ? L("slEnd") : fmtDur(sleepLeft()))}</div>` : ""}
    <div class="slg">${SL_MIN.map((m) => `<button class="chip" data-act="slset" data-m="${m}">${L("slMin", m)}</button>`).join("")}<button class="chip ${SL.eot ? "on" : ""}" data-act="slset" data-m="eot">${L("slEnd")}</button></div>
    ${on ? `<button class="mi red" data-act="sloff">${I("close")} ${L("slOff")}</button>` : ""}<div class="lyo">${L("slFade")}</div>`);
  }
  const RATES = [0.75, 1, 1.25, 1.5, 2];
  const PB = { rate: RATES.includes(Number(localStorage.getItem("sc_rate"))) ? Number(localStorage.getItem("sc_rate")) : 1 };
  function applyRate() {
    try {
      audio.preservesPitch = true;
      audio.mozPreservesPitch = true;
      audio.webkitPreservesPitch = true;
    } catch (e) {
    }
    try {
      if (audio.defaultPlaybackRate !== PB.rate) audio.defaultPlaybackRate = PB.rate;
      if (audio.playbackRate !== PB.rate) audio.playbackRate = PB.rate;
    } catch (e) {
    }
  }
  function setRate(r) {
    PB.rate = r;
    localStorage.setItem("sc_rate", String(r));
    applyRate();
    toolsUI();
    pushNative();
  }
  ["loadedmetadata", "play", "playing"].forEach((ev) => audio.addEventListener(ev, applyRate));
  const fmtRate = (r) => `${r}×`;
  function speedSheet() {
    openSheet(`<h3>⏩ ${L("spTitle")}</h3><div class="slg">${RATES.map((r) => `<button class="chip ${PB.rate === r ? "on" : ""}" data-act="spset" data-r="${r}" dir="ltr">${fmtRate(r)}</button>`).join("")}</div>`);
  }
  const EQ_F = [60, 250, 1e3, 4e3, 12e3];
  const EQ_P = { flat: [0, 0, 0, 0, 0], bass: [7, 4, 0, -1, -1], vocal: [-3, -1, 4, 4, 0], treble: [-1, -1, 0, 4, 7] };
  const EQ = {
    ok: !IS_IOS && !!(window.AudioContext || window.webkitAudioContext),
    ctx: null,
    src: null,
    pre: null,
    bands: [],
    fade: null,
    an: null,
    preset: localStorage.getItem("sc_eq_p") || "flat",
    gains: null
  };
  try {
    const g = JSON.parse(localStorage.getItem("sc_eq_g") || "null");
    EQ.gains = Array.isArray(g) && g.length === 5 && g.every((x) => isFinite(x)) ? g.map(Number) : (EQ_P[EQ.preset] || EQ_P.flat).slice();
  } catch (e) {
    EQ.gains = EQ_P.flat.slice();
  }
  const eqFlat = () => EQ.gains.every((g) => g === 0);
  function eqEnsure() {
    var _a2;
    if (!EQ.ok) return false;
    if (EQ.ctx) {
      if (EQ.ctx.state === "suspended") EQ.ctx.resume().catch(() => {
      });
      return true;
    }
    try {
      const direct = /^https?:/i.test(audio.currentSrc || audio.src || "") && !hls;
      if (audio.crossOrigin !== "anonymous") {
        audio.crossOrigin = "anonymous";
        if (direct) {
          const at = audio.currentTime, was = !audio.paused, u = audio.src;
          S.pendingSeek = at;
          S.pendingSeekId = (_a2 = curEntry()) == null ? void 0 : _a2.id;
          audio.src = u;
          if (was) audio.play().catch(() => {
          });
        }
      }
      const AC = window.AudioContext || window.webkitAudioContext, ctx = new AC();
      const src = ctx.createMediaElementSource(audio), pre = ctx.createGain(), fade = ctx.createGain(), an = ctx.createAnalyser();
      an.fftSize = 4096;
      an.smoothingTimeConstant = 0;
      const bands = EQ_F.map((f, i) => {
        const b = ctx.createBiquadFilter();
        b.type = i === 0 ? "lowshelf" : i === 4 ? "highshelf" : "peaking";
        b.frequency.value = f;
        b.Q.value = 1;
        return b;
      });
      src.connect(pre);
      let n = pre;
      for (const b of bands) {
        n.connect(b);
        n = b;
      }
      n.connect(fade);
      fade.connect(an);
      an.connect(ctx.destination);
      Object.assign(EQ, { ctx, src, pre, bands, fade, an });
      fade.gain.value = SL.vol >= 0 ? SL.vol : 1;
      try {
        audio.volume = 1;
      } catch (e) {
      }
      eqApply();
      if (ctx.state === "suspended") ctx.resume().catch(() => {
      });
      return true;
    } catch (e) {
      console.warn("eq unavailable", e);
      EQ.ok = false;
      toolsUI();
      return false;
    }
  }
  function eqApply() {
    if (!EQ.ctx) return;
    const mx = Math.max(0, ...EQ.gains);
    EQ.pre.gain.value = Math.pow(10, -mx / 20);
    EQ.bands.forEach((b, i) => {
      b.gain.value = EQ.gains[i];
    });
  }
  function eqSet(preset2, gains) {
    EQ.preset = preset2;
    EQ.gains = (gains || EQ_P[preset2] || EQ_P.flat).slice();
    localStorage.setItem("sc_eq_p", EQ.preset);
    localStorage.setItem("sc_eq_g", JSON.stringify(EQ.gains));
    if (!eqFlat() || EQ.ctx) eqEnsure();
    eqApply();
    toolsUI();
  }
  function eqSheet() {
    var _a2;
    if (!EQ.ok) return;
    const name = { flat: L("eqFlat"), bass: L("eqBass"), vocal: L("eqVocal"), treble: L("eqTreble"), custom: L("eqCustom") };
    const fl = (f) => (f >= 1e3 ? f / 1e3 + "k" : f) + "Hz";
    openSheet(`<div class="eqs"><h3>🎚 ${L("eqTitle")}</h3>
    <div class="slg">${["flat", "bass", "vocal", "treble"].map((p) => `<button class="chip ${EQ.preset === p ? "on" : ""}" data-act="eqp" data-p="${p}">${name[p]}</button>`).join("")}${EQ.preset === "custom" ? `<button class="chip on">${name.custom}</button>` : ""}</div>
    <div class="eqb">${EQ_F.map((f, i) => `<label><span dir="ltr">${fl(f)}</span><input type="range" min="-12" max="12" step="1" value="${EQ.gains[i]}" data-band="${i}"><b dir="ltr">${EQ.gains[i] > 0 ? "+" : ""}${EQ.gains[i]} dB</b></label>`).join("")}</div>
    <div class="lyo">${L("eqNote")}</div></div>`);
    (_a2 = $(".sheet .eqb")) == null ? void 0 : _a2.addEventListener("input", (e) => {
      const r = e.target.closest("input[data-band]");
      if (!r) return;
      const g = EQ.gains.slice();
      g[Number(r.dataset.band)] = Number(r.value);
      r.nextElementSibling.textContent = `${r.value > 0 ? "+" : ""}${r.value} dB`;
      eqSet("custom", g);
      document.querySelectorAll(".sheet .eqs .chip").forEach((c) => c.classList.remove("on"));
    });
  }
  audio.addEventListener("play", () => {
    if (NATIVE && !EQ.ctx && !eqFlat()) eqEnsure();
    else if (EQ.ctx && EQ.ctx.state === "suspended") EQ.ctx.resume().catch(() => {
    });
  });
  document.addEventListener("click", () => {
    if (!EQ.ctx && !eqFlat()) eqEnsure();
  }, { capture: true });
  function toolsUI() {
    const sl = $("#tsl"), sp = $("#tsp"), eq = $("#teq");
    if (sl) {
      const on = !!(SL.end || SL.eot);
      sl.classList.toggle("on", on);
      $("#tslv").textContent = on ? SL.eot ? "⏹" : fmtDur(sleepLeft()) : L("timerLbl");
    }
    if (sp) {
      sp.classList.toggle("on", PB.rate !== 1);
      $("#tspv").textContent = PB.rate === 1 ? L("spLbl") : fmtRate(PB.rate);
    }
    if (eq) {
      eq.style.display = EQ.ok ? "" : "none";
      eq.classList.toggle("on", !eqFlat());
    }
  }
  function pushNative() {
    if (!(NATIVE == null ? void 0 : NATIVE.mediaState)) return;
    const t = S.queue[S.qi];
    try {
      NATIVE.mediaState(JSON.stringify(t ? {
        id: t.id,
        title: t.title || "",
        artist: t.artist || "",
        artwork: art(t.artwork_url, "t500x500") || "",
        playing: isPlaying(),
        loading: !!S.loadingTrack,
        position: Math.floor((audio.currentTime || 0) * 1e3),
        rate: PB.rate,
        duration: Math.floor((audio.duration && isFinite(audio.duration) ? audio.duration : (t.duration_ms || 0) / 1e3) * 1e3)
      } : { stop: true }));
    } catch (e) {
    }
  }
  ["play", "pause", "loadedmetadata", "seeked", "playing", "emptied", "ratechange"].forEach((ev) => audio.addEventListener(ev, pushNative));
  window.__scMedia = (cmd, arg) => {
    switch (cmd) {
      case "play":
        playNow();
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
      h("play", () => playNow());
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
    <div class="lyp" id="lyp"></div>
    <div class="ti"><div class="m"><h2 id="fpt" dir="auto"></h2><p id="fpa" dir="auto"></p></div><button class="b" data-act="fpfav" id="fpfav">${I("heartO")}</button></div>
    <div class="seek"><input type="range" id="seek" min="0" max="1000" value="0"><div class="tm"><span id="tcur">0:00</span><span id="tdur">0:00</span></div></div>
    <div class="ctr"><button class="b sm" data-act="shuffle" id="bsh">${I("shuffle")}</button><button class="b" data-act="prev">${I("prev")}</button>
      <button class="b pl" data-act="toggle" id="fpp">${I("play")}</button><button class="b" data-act="next">${I("next")}</button>
      <button class="b sm" data-act="repeat" id="brp">${I("repeat")}</button></div>
    <div class="tools"><button data-act="lyopen" id="tly">${I("lyrics")}<span>${L("lyLbl")}</span></button>
      <button data-act="slopen" id="tsl">${I("timer")}<span id="tslv">${L("timerLbl")}</span></button>
      <button data-act="spopen" id="tsp">${I("speed")}<span id="tspv">${L("spLbl")}</span></button>
      <button data-act="eqopen" id="teq">${I("eq")}<span>${L("eqLbl")}</span></button></div>
    <div class="bar"><button data-act="fpsend">${I("send")}<span>${L("sendChat").split(" ").slice(0, 2).join(" ")}</span></button>
      <button data-act="fpaddpl">${I("plus")}<span>${L("addPl").split(" ")[0]}</span></button>
      <button data-act="showqueue">${I("queue")}<span>${L("queue")}</span></button>
      <button data-act="fpshare">${I("share")}<span>${L("share")}</span></button>
      <button data-act="fpoff" id="fpoff">${I("download")}<span>${L("ofShort")}</span></button></div></div>`;
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
      var _a2, _b2;
      if (S.needLoad) {
        const d = (((_a2 = S.queue[S.qi]) == null ? void 0 : _a2.duration_ms) || 0) / 1e3;
        S.pendingSeek = seek.value / 1e3 * d;
        S.pendingSeekId = (_b2 = S.queue[S.qi]) == null ? void 0 : _b2.id;
        persistPlayer(true);
      } else if (audio.duration) audio.currentTime = seek.value / 1e3 * audio.duration;
      dragging = false;
    });
    seek._drag = () => dragging;
    let sy = null;
    fp.addEventListener("touchstart", (e) => {
      if (e.target.closest(".seek") || e.target.closest(".lyp")) return;
      sy = e.touches[0].clientY;
    }, { passive: true });
    const lyp = $("#lyp"), manual = () => {
      LY.manualAt = Date.now();
    };
    ["wheel", "touchmove", "pointerdown"].forEach((ev) => lyp.addEventListener(ev, manual, { passive: true }));
    toolsUI();
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
    if (!t) {
      document.body.classList.remove("hasmini");
      return;
    }
    const playing = isPlaying();
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
    document.body.classList.toggle("hasmini", true);
    if (LY.open && LY.id !== t.id) lyRender();
    persistPlayer();
    fp.classList.toggle("paused", !playing);
    fp.classList.toggle("loading", S.loadingTrack);
    const fav = S.favs.has(t.id);
    $("#fpfav").innerHTML = I(fav ? "heart" : "heartO");
    $("#fpfav").classList.toggle("on", fav);
    $("#bsh").classList.toggle("on", S.shuffle);
    $("#brp").classList.toggle("on", S.repeat !== "off");
    $("#brp").innerHTML = I(S.repeat === "one" ? "repeat1" : "repeat");
    const fo = $("#fpoff");
    if (fo) {
      const have = OFF.ids.has(t.id), busy = OFF.busy.get(t.id);
      fo.style.display = OFF.ok ? "" : "none";
      fo.classList.toggle("on", have);
      fo.innerHTML = `${I(have ? "offline" : "download")}<span>${busy != null ? busy + "%" : L("ofShort")}</span>`;
    }
  }
  function updateProgress() {
    var _a2, _b2;
    const d = !S.needLoad && audio.duration || (((_a2 = S.queue[S.qi]) == null ? void 0 : _a2.duration_ms) || 0) / 1e3;
    const ct = S.needLoad ? S.pendingSeek || 0 : audio.currentTime;
    const p = d ? ct / d * 100 : 0;
    const bar = $(".mini .prog i");
    if (bar) bar.style.width = p + "%";
    const seek = $("#seek");
    if (seek && !((_b2 = seek._drag) == null ? void 0 : _b2.call(seek))) {
      seek.value = String(p * 10);
      seek.style.setProperty("--p", p + "%");
      $("#tcur").textContent = fmtDur(ct * 1e3);
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
  function queueHtml() {
    const rep = S.repeat === "one" ? L("repeatOne") : S.repeat === "all" ? L("repeatAll") : L("repeatOff");
    return `<div class="qwrap"><div class="qhdr"><h3>${L("queue")} · ${S.queue.length}</h3>
      ${S.queue.length > 1 ? `<button class="qclr" data-act="qclear">${I("trash2")} ${L("qClear")}</button>` : ""}</div>
    <div class="seg qmodes"><button class="chip ${S.shuffle ? "on" : ""}" data-act="shuffle">${I("shuffle", "ci")} ${L("shuffle")}</button>
      <button class="chip ${S.repeat !== "off" ? "on" : ""}" data-act="repeat">${I(S.repeat === "one" ? "repeat1" : "repeat", "ci")} ${rep}</button></div>
    ${S.queue.length ? `<div class="list qlist">${S.queue.map((t, i) => `<div class="tr qrow ${i === S.qi ? "cur" : ""}" data-qi="${i}">
        <button class="qdrag" data-qi="${i}" aria-label="${esc(L("qDrag"))}">${I("drag")}</button>
        <div class="art" data-act="qjump" data-i="${i}">${img(t.artwork_url, "t120x120")}${i === S.qi ? `<div class="eqi"><i></i><i></i><i></i></div>` : ""}</div>
        <div class="meta" data-act="qjump" data-i="${i}"><div class="t" dir="auto">${esc(t.title)}</div>
          <div class="a" dir="auto">${i === S.qi ? `<span class="badge qnow">${L("nowPlaying")}</span>` : ""}${esc(t.artist)} · ${fmtDur(t.duration_ms)}</div></div>
        <button class="more" data-act="qmenu" data-i="${i}">${I("more")}</button></div>`).join("")}</div>` : emptyBox("queue", L("queueEmpty"))}</div>`;
  }
  function showQueue() {
    const box = $(".sheet.show .qwrap");
    if (box) {
      const sh = $(".sheet"), y = sh.scrollTop;
      box.outerHTML = queueHtml();
      sh.scrollTop = y;
      return;
    }
    openSheet(queueHtml());
    requestAnimationFrame(() => {
      const c = $(".sheet .qrow.cur");
      if (c && c.scrollIntoView) c.scrollIntoView({ block: "center" });
    });
  }
  const refreshQueue = () => {
    if ($(".sheet.show .qwrap")) showQueue();
  };
  function queueItemMenu(i) {
    const t = S.queue[i];
    if (!t) return;
    const cur = i === S.qi;
    openSheet(`<div class="sh"><div class="art">${img(t.artwork_url, "t120x120")}</div><div><div class="t" dir="auto">${esc(t.title)}</div><div class="a" dir="auto">${esc(t.artist)} · ${fmtDur(t.duration_ms)}</div></div></div>
    ${cur ? "" : `<button class="mi" data-act="qjump" data-i="${i}">${I("play")} ${L("qPlay")}</button>
    <button class="mi" data-act="qnext" data-i="${i}">${I("queue")} ${L("qNext")}</button>
    <button class="mi" data-act="qend" data-i="${i}">${I("down")} ${L("qEnd")}</button>
    <button class="mi red" data-act="qrm" data-i="${i}">${I("trash")} ${L("qRemove")}</button>`}
    <button class="mi" data-act="qback">${I("up")} ${L("queue")}</button>`);
  }
  function qDragStart(e) {
    const h = e.target.closest && e.target.closest(".qdrag");
    if (!h) return;
    const row = h.closest(".qrow"), list = row && row.parentElement, sheet = $(".sheet");
    if (!list) return;
    e.preventDefault();
    const rows = [...list.children], from = rows.indexOf(row), rh = row.getBoundingClientRect().height || 60;
    let to = from, y0 = e.clientY, sc0 = sheet.scrollTop, lastY = e.clientY, raf = 0;
    row.classList.add("drag");
    try {
      h.setPointerCapture(e.pointerId);
    } catch (e2) {
    }
    const layout = () => {
      const dy = lastY - y0 + (sheet.scrollTop - sc0);
      to = Math.max(0, Math.min(rows.length - 1, from + Math.round(dy / rh)));
      row.style.transform = `translateY(${dy}px)`;
      rows.forEach((x, k) => {
        if (x === row) return;
        const sft = from < to && k > from && k <= to ? -rh : from > to && k >= to && k < from ? rh : 0;
        x.style.transform = sft ? `translateY(${sft}px)` : "";
      });
    };
    const tick = () => {
      const r = sheet.getBoundingClientRect();
      if (lastY < r.top + 60) sheet.scrollTop -= 10;
      else if (lastY > r.bottom - 60) sheet.scrollTop += 10;
      layout();
      raf = requestAnimationFrame(tick);
    };
    const move = (ev) => {
      lastY = ev.clientY;
    };
    const up = () => {
      cancelAnimationFrame(raf);
      h.removeEventListener("pointermove", move);
      h.removeEventListener("pointerup", up);
      h.removeEventListener("pointercancel", up);
      rows.forEach((x) => {
        x.style.transform = "";
      });
      row.classList.remove("drag");
      if (to !== from) {
        qMove(from, to);
        haptic("soft");
      } else showQueue();
    };
    h.addEventListener("pointermove", move);
    h.addEventListener("pointerup", up);
    h.addEventListener("pointercancel", up);
    raf = requestAnimationFrame(tick);
  }
  async function toggleFav(id) {
    id = Number(id);
    try {
      const r = await api("/favorites", { method: "POST", body: { track_id: id } });
      r.favorite ? S.favs.add(id) : S.favs.delete(id);
      if (r.favorite) {
        const t = S.tracks.get(id);
        if (t) {
          S.favList = (S.favList || []).filter((x) => x.id !== id);
          S.favList.unshift(t);
          setTimeout(() => favAutoRun("fav"), 800);
        }
      }
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
  async function copyText(txt) {
    try {
      if (NATIVE == null ? void 0 : NATIVE.copy) NATIVE.copy(txt);
      else await navigator.clipboard.writeText(txt);
      toast(L("copied"));
      hapticOk();
    } catch (e) {
      prompt("", txt);
    }
  }
  function nativeShare(link, text) {
    if (NATIVE == null ? void 0 : NATIVE.share) {
      try {
        NATIVE.share(text, link);
        return;
      } catch (e) {
      }
    }
    S.shareData = { link, text };
    openSheet(`<div class="shr"><div class="ico">${I("share")}</div><h3>${L("shareTitle")}</h3><div class="t">${esc(text)}</div><div class="lnk" dir="ltr">${esc(link)}</div></div>
    <button class="mi" data-act="sh_copy">${I("link")} ${L("copyLink")}</button>
    <button class="mi" data-act="sh_tg">${I("tg")} ${L("shareTg")}</button>
    <button class="mi" data-act="sh_open">${I("share")} ${L("shareOpen")}</button>`);
  }
  function shareTrack(t) {
    var _a2;
    if (!t) return;
    const text = `🎧 ${t.artist} — ${t.title}`;
    if (NATIVE) return nativeShare(`${APP_LINK}/t/${t.id}`, text);
    return shareLink(`https://t.me/${(_a2 = S.bot) == null ? void 0 : _a2.username}?start=t_${t.id}`, text);
  }
  const plCode = (r) => r.code || String(r.link || "").split("pl_")[1] || "";
  async function loadFavs() {
    try {
      if (!S.favId) await loadPlaylists();
      if (!S.favId) return;
      const d = await api(`/playlists/${S.favId}`);
      S.favs = new Set(d.tracks.map((t) => t.id));
      remember(d.tracks);
      S.favList = d.tracks;
    } catch (e) {
    }
    favAutoRun("start");
  }
  async function onClick(e) {
    var _a2, _b2, _c2, _d2, _e2, _f2, _g, _h, _i, _j, _k, _l, _m;
    const el = e.target.closest("[data-act]");
    if (!el) return;
    const a = el.dataset.act, id = el.dataset.id;
    if (a === "menu" || a === "mvup" || a === "mvdn" || a === "rmpl" || a === "qrm") e.stopPropagation();
    switch (a) {
      case "tab":
        return setTab(el.dataset.tab);
      case "play": {
        const ctx = el.dataset.ctx, list = CTX[ctx] || [S.tracks.get(Number(id))];
        if (ctx === "rec" && el.closest(".sheet")) closeSheet();
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
        setShuffle(!S.shuffle);
        haptic();
        return toast(S.shuffle ? L("shuffleOn") : L("shuffleOff"));
      case "repeat":
        S.repeat = { off: "all", all: "one", one: "off" }[S.repeat];
        haptic();
        persistPlayer(true);
        updatePlayerUI();
        refreshQueue();
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
      case "fpshare":
        return shareTrack(S.queue[S.qi]);
      case "m_share":
        closeSheet();
        return setTimeout(() => shareTrack(S.tracks.get(Number(id))), 200);
      case "sh_copy":
        closeSheet();
        return S.shareData && copyText(S.shareData.link);
      case "sh_tg":
        closeSheet();
        return S.shareData && shareLink(S.shareData.link, S.shareData.text);
      case "sh_open":
        closeSheet();
        return S.shareData && openExt(S.shareData.link);
      case "showqueue":
        return showQueue();
      case "lyopen":
        return lyToggle();
      case "lyseek":
        return lySeek(Number(el.dataset.t));
      case "slopen":
        return sleepSheet();
      case "slset":
        closeSheet();
        return sleepSet(el.dataset.m === "eot" ? "eot" : Number(el.dataset.m));
      case "sloff":
        closeSheet();
        return sleepClear();
      case "spopen":
        return speedSheet();
      case "spset":
        closeSheet();
        setRate(Number(el.dataset.r));
        return toast(`⏩ ${fmtRate(PB.rate)}`);
      case "eqopen":
        return eqSheet();
      case "eqp": {
        eqSet(el.dataset.p);
        document.querySelectorAll(".sheet .eqs .chip").forEach((c) => c.classList.toggle("on", c.dataset.p === el.dataset.p));
        document.querySelectorAll(".sheet .eqb input").forEach((r, i) => {
          r.value = EQ.gains[i];
          r.nextElementSibling.textContent = `${EQ.gains[i] > 0 ? "+" : ""}${EQ.gains[i]} dB`;
        });
        return;
      }
      case "rsgo":
        return rsGo();
      case "rsx":
        return rsHide(true);
      case "stats":
        closeSheet();
        return go({ type: "stats" });
      case "strange": {
        const v = view();
        v.range = el.dataset.r;
        return vStats(v);
      }
      case "stshare":
        return stShare();
      case "stclear": {
        if (!await confirmAsk(L("stClearQ"))) return;
        PL.cur = null;
        try {
          localStorage.removeItem("sc_play_cur");
        } catch (e2) {
        }
        await stTx("readwrite", (st) => st.clear()).catch(() => {
        });
        toast(L("stCleared"));
        return vStats(view());
      }
      case "rechist":
        closeSheet();
        return go({ type: "rechist" });
      case "rhclear": {
        if (!await confirmAsk(L("recHistClear") + "?")) return;
        localStorage.removeItem("sc_rec_hist");
        return render();
      }
      case "recsearch": {
        const q = el.dataset.q || "";
        closeSheet();
        S.search.type = "tracks";
        setTab("search");
        const inp = $("#q");
        if (inp) inp.value = q;
        return doSearch(q, true);
      }
      case "rdl": {
        const t = S.tracks.get(Number(id));
        if (!t) return;
        if (OFF.ids.has(t.id)) return toast(L("ofSaved"));
        return dlSheet(t);
      }
      case "qjump": {
        const i = Number(el.dataset.i);
        closeSheet();
        if (i === S.qi && !S.needLoad) return;
        S.qi = i;
        return loadCurrent();
      }
      case "qrm": {
        qRemove(Number(el.dataset.i));
        toast(L("qRemoved"));
        return showQueue();
      }
      case "qmenu":
        return queueItemMenu(Number(el.dataset.i));
      case "qnext": {
        qMoveNext(Number(el.dataset.i));
        toast(L("qMovedNext"));
        return showQueue();
      }
      case "qend": {
        qMoveEnd(Number(el.dataset.i));
        toast(L("qMovedEnd"));
        return showQueue();
      }
      case "qback":
        return showQueue();
      case "qclear": {
        if (S.queue.length < 2) return;
        if (!await confirmAsk(L("qClearQ"))) return showQueue();
        qClear();
        toast(L("qCleared"));
        return showQueue();
      }
      // menu items
      case "closesheet":
        return closeSheet();
      case "m_next": {
        const t = S.tracks.get(Number(id));
        closeSheet();
        if (!t) return;
        if (!S.queue.length) return playList([t], 0);
        qInsertNext(t);
        return toast("✅ " + L("playNext"));
      }
      case "m_queue": {
        const t = S.tracks.get(Number(id));
        closeSheet();
        if (!t) return;
        if (!S.queue.length) return playList([t], 0);
        qAppend(t);
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
          NATIVE ? nativeShare(`${APP_LINK}/p/${plCode(r)}`, "🎧 " + v.data.playlist.name) : shareLink(r.link, "🎧 " + v.data.playlist.name);
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
          await copyText(NATIVE ? `${APP_LINK}/p/${plCode(r)}` : r.link);
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
        const q = ((_c2 = (_b2 = S.me) == null ? void 0 : _b2.user) == null ? void 0 : _c2.quality) === "low" ? "high" : "low";
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
        const u = `https://t.me/${(_d2 = S.bot) == null ? void 0 : _d2.username}`;
        if (tg == null ? void 0 : tg.openTelegramLink) {
          tg.openTelegramLink(u);
          return tg.close();
        }
        return openExt(u);
      }
      case "getapp":
        return openExt(((_e2 = S.bot) == null ? void 0 : _e2.username) ? `https://t.me/${S.bot.username}?start=download` : DL.page);
      case "checkupd":
        return checkUpdate(true);
      case "updnow":
        closeSheet();
        return openExt(el.dataset.url);
      case "rec":
        return recOpen();
      case "recstop":
        return recStop(true);
      case "recagain":
        return recOpen();
      case "recfile":
        return recPickFile();
      case "recbot": {
        recStop();
        closeSheet();
        const u = `https://t.me/${((_f2 = S.bot) == null ? void 0 : _f2.username) || "SoundClouddl_RoBot"}`;
        if ((tg == null ? void 0 : tg.openTelegramLink) && !NATIVE) {
          tg.openTelegramLink(u);
          (_g = tg.close) == null ? void 0 : _g.call(tg);
        } else openExt(u);
        return;
      }
      case "recext":
        return openExt(el.dataset.url);
      case "cfyes":
      case "cfno": {
        const f = S._cf;
        S._cf = null;
        closeSheet();
        f && f(a === "cfyes");
        return;
      }
      case "offopen":
        closeSheet();
        return S.tab === "library" || S.tab === "settings" ? go({ type: "offline" }) : (setTab("library"), go({ type: "offline" }));
      case "offplay":
      case "offshuffle": {
        const l = offTracks();
        if (!l.length) return;
        remember(l);
        S.shuffle = a === "offshuffle";
        return playList(l, a === "offshuffle" ? Math.floor(Math.random() * l.length) : 0);
      }
      case "offauto":
        OFF.auto = !OFF.auto;
        localStorage.setItem("sc_off_auto", OFF.auto ? "1" : "0");
        haptic();
        return vSettings();
      case "offlimit": {
        const i = LIMITS.indexOf(OFF.limitMB);
        OFF.limitMB = LIMITS[(i + 1) % LIMITS.length];
        localStorage.setItem("sc_off_limit", String(OFF.limitMB));
        await offEvict((_h = S.queue[S.qi]) == null ? void 0 : _h.id);
        haptic();
        return vSettings();
      }
      case "offclear": {
        if (!OFF.ids.size) return;
        if (!await confirmAsk(L("ofClearQ"))) return;
        await offClear();
        toast(L("ofCleared"));
        return render();
      }
      case "m_offsave": {
        const t = S.tracks.get(Number(id));
        if (!t) return closeSheet();
        if (dlJob(t.id) || OFF.busy.has(t.id)) {
          if (await confirmAsk(L("ofCancelQ"))) {
            dlCancel(t.id) || offCancel(t.id);
          }
          return;
        }
        return dlSheet(t);
      }
      case "m_offdel": {
        closeSheet();
        await offDel(Number(id));
        toast(L("ofRemoved"));
        return refreshOfflineUI();
      }
      case "fpoff": {
        const t = S.queue[S.qi];
        if (!t) return;
        if (dlJob(t.id) || OFF.busy.has(t.id)) {
          if (await confirmAsk(L("ofCancelQ"))) {
            dlCancel(t.id) || offCancel(t.id);
          }
          return;
        }
        if (OFF.ids.has(t.id)) return toast(L("ofSaved"));
        return dlSheet(t);
      }
      case "pldl": {
        const v = view();
        const l = ((_i = v == null ? void 0 : v.data) == null ? void 0 : _i.tracks) || [];
        if (l.some((x) => dlJob(x.id))) return go({ type: "downloads" });
        return dlBatchSheet(l);
      }
      case "dlpick":
        return dlPick(Number(el.dataset.i));
      case "dlbatch":
        return dlBatchGo(el.dataset.q);
      case "dlopen":
        closeSheet();
        return go({ type: "downloads" });
      case "dlcancel":
        e.stopPropagation();
        dlCancel(Number(id));
        return;
      case "dlcancelall":
        if (await confirmAsk(L("ofCancelAllQ"))) dlCancelAll();
        return;
      case "dlretry":
        return dlRetry(null);
      case "dlretryone":
        e.stopPropagation();
        return dlRetry(Number(id));
      case "dlclear":
        return dlClearDone();
      case "ofq":
        localStorage.setItem("sc_off_q", offQ() === "high" ? "low" : "high");
        haptic();
        return vSettings();
      case "favauto": {
        const on = !favAutoOn();
        localStorage.setItem("sc_off_favauto", on ? "1" : "0");
        haptic();
        if (!on) {
          for (const j of DLM.jobs) if (j.auto && j.st === "queued") j.st = "cancel";
          if (((_j = DLM.cur) == null ? void 0 : _j.auto) && DLM.cur.ctrl) DLM.cur.ctrl.abort();
          dlRefresh();
        }
        vSettings();
        if (on) {
          if (!S.favList) await loadFavs();
          favAutoRun("toggle");
        }
        return;
      }
      case "updstart": {
        if (!((_k = S.update) == null ? void 0 : _k.verified) || !(NATIVE == null ? void 0 : NATIVE.downloadUpdate)) return;
        S.upd = { state: "start", received: 0, total: S.update.size };
        updSheet(true);
        haptic();
        try {
          NATIVE.downloadUpdate(S.update.url, S.update.v);
        } catch (e2) {
          onUpdEvent({ state: "error" });
        }
        return;
      }
      case "updcancel":
        try {
          (_l = NATIVE == null ? void 0 : NATIVE.cancelUpdate) == null ? void 0 : _l.call(NATIVE);
        } catch (e2) {
        }
        S.upd = null;
        return updSheet(false);
      case "updinstall":
        try {
          (_m = NATIVE == null ? void 0 : NATIVE.installUpdate) == null ? void 0 : _m.call(NATIVE);
        } catch (e2) {
        }
        return;
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
      case "logincopy":
        return S.login && copyText(S.login.link);
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
    var _a2, _b2, _c2, _d2;
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
      (_d2 = NATIVE == null ? void 0 : NATIVE.setTheme) == null ? void 0 : _d2.call(NATIVE, bg, scheme === "light");
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
    await offInit();
    window.addEventListener("online", () => {
      if (S.offline && (appToken || initData)) {
        toast(L("ofBack"));
        startApp();
      }
    });
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
    S.needLoad = false;
    try {
      localStorage.removeItem(PLAYER_KEY);
    } catch (e) {
    }
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
  const fmtMB = (b) => `${((b || 0) / 1048576).toFixed(1)} MB`;
  async function checkUpdate(manual) {
    var _a2;
    if (!NATIVE) return;
    if (manual && S.update) return updSheet(true);
    try {
      const r = await fetch(`https://api.github.com/repos/${GH_REPO}/releases/latest`, { headers: { Accept: "application/vnd.github+json" } });
      const j = await r.json();
      const v = String(j.tag_name || "").replace(/^v/, "");
      if (v && cmpVer(v, NATIVE.version) > 0) {
        const android = NATIVE.platform === "android";
        const name = android ? "SoundCloud-Player.apk" : "SoundCloud-Player-Setup.exe";
        const assets = j.assets || [];
        const a = assets.find((x) => x.name === name);
        const sums = assets.some((x) => x.name === "SHA256SUMS");
        S.update = { v, url: (a == null ? void 0 : a.browser_download_url) || (android ? DL.apk : DL.exe), size: (a == null ? void 0 : a.size) || 0, verified: !!(a && sums) };
        if (S.tab === "settings" && ((_a2 = view()) == null ? void 0 : _a2.type) === "settings") render();
        if (!manual && S.updShown) return;
        S.updShown = true;
        updSheet(true);
      } else if (manual) toast(L("upToDate"));
    } catch (e) {
      if (manual) toast(L("err"));
    }
  }
  function updSheet(open) {
    const u = S.update;
    if (!u) return;
    const d = S.upd || {}, android = (NATIVE == null ? void 0 : NATIVE.platform) === "android", inApp = !!(NATIVE == null ? void 0 : NATIVE.downloadUpdate) && !!u.verified;
    const total = d.total || u.size || 0, pct = d.state === "done" ? 100 : total ? Math.min(100, Math.floor((d.received || 0) * 100 / total)) : 0;
    let body;
    if (d.state === "start" || d.state === "progress") {
      body = `<div class="upd-bar"><i style="width:${pct}%"></i></div>
      <div class="upd-pct"><b>${pct}%</b><span dir="ltr">${fmtMB(d.received)} / ${fmtMB(total)}</span></div>
      <p class="upd-st">${L("updDownloading")}</p>
      <div class="row2"><button class="btn" data-act="updcancel">${L("cancel")}</button></div>`;
    } else if (d.state === "verifying") {
      body = `<div class="upd-bar ok"><i style="width:100%"></i></div><div class="upd-pct"><b>100%</b><span dir="ltr">${fmtMB(total)}</span></div>
      <p class="upd-st"><span class="mini-spin"></span> ${L("updVerify")}</p>`;
    } else if (d.state === "done") {
      body = `<div class="upd-bar ok"><i style="width:100%"></i></div><div class="upd-pct"><b>100%</b><span dir="ltr">${fmtMB(total)}</span></div>
      <p class="upd-st">${android ? L("updReadyA") : L("updReadyW")}</p>
      <div class="row2"><button class="btn" data-act="closesheet">${L("later")}</button><button class="btn pri" data-act="updinstall">${I("download")} ${L("updInstall")}</button></div>`;
    } else if (d.state === "installing") {
      body = `<div class="upd-bar ok"><i style="width:100%"></i></div><p class="upd-st"><span class="mini-spin"></span> ${L("updInstallW")}</p>`;
    } else if (d.state === "perm") {
      body = `<div class="upd-bar ok"><i style="width:100%"></i></div><p class="upd-st">${L("updPerm")}</p>
      <div class="row2"><button class="btn pri" data-act="updinstall">${I("download")} ${L("updInstall")}</button></div>`;
    } else {
      body = `${d.state === "error" ? `<p class="upd-err">${d.msg === "verify" ? L("updBad") : L("updFail")}</p>` : ""}
      <div class="row2"><button class="btn" data-act="closesheet">${L("later")}</button>
      <button class="btn pri" data-act="${inApp ? "updstart" : "updnow"}" data-url="${esc(u.url)}">${I("download")} ${inApp ? L("updDlInstall") : L("updDl")}</button></div>`;
    }
    const html = `<div class="upd"><div class="ico">${I("download")}</div><h3>${L("updTitle")}</h3>
    <p>${L("updAvail", esc(u.v))}${u.size ? ` · <span dir="ltr">${fmtMB(u.size)}</span>` : ""}</p>${body}</div>`;
    const cur = $(".sheet.show .upd");
    if (cur) cur.outerHTML = html;
    else if (open) openSheet(html);
  }
  function onUpdEvent(d) {
    var _a2;
    const prev2 = (_a2 = S.upd) == null ? void 0 : _a2.state;
    S.upd = d.state === "canceled" ? null : d;
    if (d.state === "error" && !$(".sheet.show .upd")) toast(d.msg === "verify" ? L("updBad") : L("updFail"));
    if ((d.state === "done" || d.state === "perm") && prev2 !== d.state) {
      hapticOk();
      updSheet(true);
      return;
    }
    updSheet(false);
  }
  const NATIVE_ORIGIN = "https://appassets.androidplatform.net";
  function onNativeEvent(d) {
    if (!d || typeof d !== "object" || typeof d.__sc !== "string") return;
    if (d.__sc === "upd") onUpdEvent(d);
    if (d.__sc === "link" && S.me) openDeep(takeNativeLink());
    if (d.__sc === "net") {
      netCache = null;
      favAutoRun("net");
    }
  }
  if (NATIVE == null ? void 0 : NATIVE.onEvent) {
    try {
      NATIVE.onEvent(onNativeEvent);
    } catch (e) {
    }
  }
  window.addEventListener("message", (e) => {
    if (!NATIVE || NATIVE.onEvent) return;
    if (e.source !== window || e.origin !== location.origin || e.origin !== NATIVE_ORIGIN) return;
    onNativeEvent(e.data);
  });
  const takeNativeLink = () => {
    try {
      return (NATIVE == null ? void 0 : NATIVE.takeLink) && NATIVE.takeLink() || "";
    } catch (e) {
      return "";
    }
  };
  async function openDeep(sp, initial) {
    sp = String(sp || "");
    if (!sp) return;
    if (sp.startsWith("pl_")) {
      if (!initial) {
        closeSheet();
        $(".fp.show") && (closePlayer == null ? void 0 : closePlayer());
        S.tab = "home";
        S.stack = [{ type: "home" }];
        rebuildChrome == null ? void 0 : rebuildChrome();
      }
      S.stack.push({ type: "shared", code: sp.slice(3) });
      render();
      syncBack();
      return;
    }
    if (sp.startsWith("t_")) {
      try {
        const d = await api(`/track/${sp.slice(2)}`);
        remember([d.track]);
        playList([d.track], 0);
        closeSheet();
        openPlayer();
      } catch (e) {
        toast(L("err"));
      }
      return;
    }
    if (sp.startsWith("s_")) {
      S.search.q = "";
      setTab("search");
      doSearch(decodeURIComponent(sp.slice(2)).replace(/_/g, " "));
    }
  }
  async function startApp() {
    var _a2;
    document.body.classList.remove("auth");
    try {
      S.me = await api("/me");
      S.bot = S.me.bot;
      S.offline = false;
      try {
        localStorage.setItem("sc_me", JSON.stringify(S.me));
      } catch (e) {
      }
      if (S.me.user.lang && S.me.user.lang !== lang) {
        lang = S.me.user.lang;
        applyLang();
        rebuildChrome();
      }
      if (NATIVE) localStorage.setItem("sc_lang", lang);
    } catch (e) {
      if (NATIVE && e.status === 401) return;
      let cachedMe = null;
      try {
        cachedMe = JSON.parse(localStorage.getItem("sc_me") || "null");
      } catch (e2) {
      }
      if (!e.status && OFF.ids.size) {
        S.offline = true;
        if (cachedMe) {
          S.me = cachedMe;
          S.bot = cachedMe.bot;
        }
        S.tab = "library";
        S.stack = [{ type: "library" }, { type: "offline" }];
        document.querySelectorAll(".nav button").forEach((b) => b.classList.toggle("on", b.dataset.tab === "library"));
        render();
        syncBack();
        toast(L("ofMode"));
        restorePlayer();
        return;
      }
      root().innerHTML = `<div class="view">${emptyBox("bot", e.status === 401 ? L("unauthorized") : L("err"))}<div style="text-align:center"><button class="btn pri" data-act="retry">${L("retry")}</button>${OFF.ids.size ? ` <button class="btn" data-act="offopen">${I("offline")} ${L("ofTitle")}</button>` : ""}</div></div>`;
      return;
    }
    if (NATIVE) setTimeout(() => checkUpdate(false), 4e3);
    const sp = ((_a2 = tg == null ? void 0 : tg.initDataUnsafe) == null ? void 0 : _a2.start_param) || takeNativeLink();
    S.stack = [{ type: "home" }];
    render();
    syncBack();
    restorePlayer();
    openDeep(sp, true);
    loadFavs();
    setTimeout(() => {
      rsFlush();
      rsCheck(true);
    }, 1200);
  }
  if (window.__SC_TEST__) {
    window.__scTest = {
      S,
      REC,
      OFF,
      applyLang: (l) => {
        if (l) lang = l;
        applyLang();
        return document.documentElement.dir;
      },
      doSearch,
      searchSeq: () => searchSeq,
      recOpen,
      closeSheet,
      openSheet,
      offPut,
      offDownload,
      offCancel,
      DLM,
      dlEnqueue,
      roomCheck,
      netInfo,
      favAutoRun,
      PL,
      SL,
      PB,
      EQ,
      LY,
      RS,
      DEVICE_ID,
      isCounted,
      stCompute,
      stLoad,
      plCommit,
      plEnd,
      sleepSet,
      sleepClear,
      setRate,
      eqSet,
      eqEnsure,
      setShuffle,
      qInsertNext,
      qAppend,
      qRemove,
      qMove,
      qClear,
      rsCheck,
      rsSave,
      rsFlush,
      recShow,
      recHist,
      offTx,
      lyRender,
      render,
      go,
      persistPlayer,
      savedPlayer: () => readSavedPlayer(),
      audio,
      playList
    };
  }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", boot) : boot();
})();
