/* 🎙️ 말하기 연습 탭 (시험판: 제1~9과)
   ① 성조 곡선 낭독: 마이크로 문장을 읽으면 목소리의 음높이(성조 곡선)를 그려,
      교과서 성조 모양(5도 표기: 1성 55, 2성 35, 3성 214, 4성 51)과 나란히 보여 줍니다.
      - 서버 없이 브라우저 안에서만 계산하고, 녹음은 어디에도 올리지 않습니다.
      - 음절 위치는 목소리가 난 구간을 글자 수로 나눠 어림한 것이라 '참고용'입니다.
   ② 자유 말하기: 크롬의 음성 인식으로 말한 내용을 글자로 받아 적습니다.
      학생이 자기 API 키(학교 발급)를 한 번 넣으면 🤖 AI 평가 받기로 바로 평가받아요.
   index.html이 SPEAKING.has(n) / SPEAKING.html(n, c) / SPEAKING.mount(el, n, c)를 부릅니다. */
(function () {
  "use strict";

  /* AI 평가: 학생이 학교에서 받은 자기 API 키를 넣으면 브라우저에서 바로 평가 (서버 없음)
     키 모양으로 회사를 고름: sk-ant-… Claude · AIza… Gemini · sk-… ChatGPT
     키는 이 브라우저(localStorage, '계속 저장'을 끄면 sessionStorage)에만 저장 */
  var KEY_NAME = "sp-ai-key";
  var LESSON_INFO = {
    "101": ["제1과 你选好课了吗？", "결과보어(选好·记住·做完·买到), 是不是 확인 의문문, 형용사 중첩(雪白雪白的), 连……都/也, 추측의 应该, 동량보어(去过两次), 시량보어(学了两个小时), 离, 有点儿/一点儿, 一……就……"],
    "102": ["제2과 路上辛苦了！", "동태조사 着(穿着·放着·挂着, 走着去), 겸어문(让·叫·请·派), 정도보어(说得很流利, 唱歌唱得很好听), 因为……所以……, 결과보어 在(住在)"],
    "103": ["제3과 你在打什么工？", "진행 在, 이합사(打工·见面·睡觉: 见过一次面·睡了十个小时觉), 是……的 강조, 把자문(发给·放在·换成·打扫得), 得/不用, 该……了, 还是……吧, 형용사 중첩(辛辛苦苦·好好儿)"],
    "104": ["제4과 今天天气怎么样？", "날씨 표현(刮风·下雨·雾霾), 방향보어(拿出来·下起雨来·笑起来), 가능보어(听得懂·看不完·买不起·起不来·坐得下), 比 비교문(比……一些/得多/更), 没有……那么, 跟……一样, 一边……一边……, 어림수 多"],
    "105": ["제5과 水煮肉是我们店的招牌菜", "의문사 임의지시(什么都·谁都·哪儿都·谁……谁……), 의문사 불특정(想吃点儿什么), 虽然……但是……, 不但……而且……, 就/才, 适合/合适, 为了, 来(我来介绍)"],
    "106": ["제6과 我想换钱", "对(对……感兴趣), 除了……以外, 越……越……/越来越, 左右·多 어림, 以为, 把……换成/还给, 길 안내(一直往前走·往左拐), 正好, 的话"],
    "107": ["제7과 您哪儿不舒服？", "증상 표현(发烧·咳嗽·头疼), 一点儿……也不……, 什么都, 조동사 应该·该·得·不得, 가능보어 了(做不了·忘不了·上不了), 是……的"],
    "108": ["제8과 你去过故宫和长城吗？", "경험 过(去过·没吃过·看过两次), 既……又……, 差点儿/差点儿没, 只要……就……, 只有……才……, 被자문, 先……再……最后……, 既然……就……, 难道, A倒是A, 不过"],
    "109": ["제9과 不是刷微博，就是看短视频", "不是……就是……, 不是……而是……, 从来不/没, 于(毕业于·位于·沉迷于), 정도 표현(热死了·好极了·累得要命), 越来越, 什么的, 下去(学下去), 吃不消, 不仅……也……"],
  };

  /* 과별 자유 말하기 제시어 */
  var PROMPTS = {
    "101": [
      { zh: "你这个学期选了什么课？选好了吗？", ko: "이번 학기에 무슨 수업을 신청했나요? 다 신청했나요?", hint: "选好、有点儿、一……就……、应该" },
      { zh: "你放假的时候做了什么？去哪儿了？", ko: "방학 때 무엇을 했나요? 어디에 갔나요?", hint: "去过……次、……了……天、雪白雪白的、离……很远" },
      { zh: "说说你这个学期的计划。", ko: "이번 학기 계획을 말해 보세요.", hint: "连……都、打算、应该、一……就……" },
    ],
    "102": [
      { zh: "你最近一次坐飞机或者坐火车旅行，路上怎么样？", ko: "최근에 비행기나 기차로 여행했을 때 가는 길이 어땠나요?", hint: "因为……所以……、让、……了一个小时" },
      { zh: "你的房间里有什么？请说一说。", ko: "내 방에 무엇이 있는지 말해 보세요.", hint: "桌子上放着、墙上挂着、门开着" },
      { zh: "你哪方面做得好？哪方面做得不太好？", ko: "어떤 걸 잘하고 어떤 건 잘 못하나요?", hint: "说汉语说得、……得很好、……得不太……" },
    ],
    "103": [
      { zh: "你打过工吗？在哪儿打工？做什么？", ko: "아르바이트를 해 본 적이 있나요? 어디서 무엇을 했나요?", hint: "在……打工、做家教、教……、是从……开始的" },
      { zh: "你是什么时候、在哪儿开始学汉语的？", ko: "언제, 어디서 중국어를 배우기 시작했나요?", hint: "是……的、跟……见面、得" },
      { zh: "你打工挣的钱想怎么用？", ko: "아르바이트로 번 돈을 어떻게 쓰고 싶나요?", hint: "把……、还是……吧、再……才能……" },
    ],
    "104": [
      { zh: "今天天气怎么样？你喜欢什么样的天气？", ko: "오늘 날씨가 어떤가요? 어떤 날씨를 좋아하나요?", hint: "刮风、下起雨来、雾霾、多穿点儿" },
      { zh: "比较一下首尔和你去过的另一个城市。", ko: "서울과 가 본 다른 도시를 비교해 보세요.", hint: "A比B……、没有……那么……、跟……一样" },
      { zh: "你周末一般做什么？", ko: "주말에 보통 무엇을 하나요?", hint: "一边……一边……、听得懂/看不完、……多" },
    ],
    "105": [
      { zh: "你最喜欢吃什么菜？为什么？", ko: "가장 좋아하는 음식은 무엇이고 왜 좋아하나요?", hint: "虽然……但是……、不但……而且……、辣辣的" },
      { zh: "你去饭馆儿的时候一般怎么点菜？", ko: "식당에 가면 보통 어떻게 주문하나요?", hint: "再来一碗、什么都、你来点吧" },
      { zh: "给朋友介绍一家你喜欢的饭馆儿。", ko: "친구에게 좋아하는 식당 하나를 소개해 보세요.", hint: "适合、为了、哪家……就去哪家" },
    ],
    "106": [
      { zh: "你去过银行或者邮局吗？办了什么事？", ko: "은행이나 우체국에 가 본 적이 있나요? 무슨 일을 봤나요?", hint: "把美元换成人民币、寄快递、填表" },
      { zh: "你对什么感兴趣？为什么？", ko: "무엇에 관심이 있나요? 왜 그런가요?", hint: "对……感兴趣、越……越……、越来越……" },
      { zh: "从你家到学校怎么走？要多长时间？", ko: "집에서 학교까지 어떻게 가고, 얼마나 걸리나요?", hint: "一直往前走、往左拐、从……到……、左右" },
    ],
    "107": [
      { zh: "你最近一次生病是什么时候？哪儿不舒服？", ko: "최근에 아팠던 게 언제였나요? 어디가 아팠나요?", hint: "发烧、咳嗽、头疼、一点儿……也不……" },
      { zh: "感冒的时候你怎么办？", ko: "감기에 걸리면 어떻게 하나요?", hint: "应该、该、好好儿休息、多喝水" },
      { zh: "有什么事情是你一个人做不了的？", ko: "혼자서는 할 수 없는 일이 있나요?", hint: "做不了/做得了、忘不了、上不了课" },
    ],
    "108": [
      { zh: "你去过哪些地方旅行？最难忘的是哪儿？", ko: "어디로 여행을 가 봤나요? 가장 기억에 남는 곳은 어디인가요?", hint: "去过……次、既……又……、玩儿得很开心" },
      { zh: "如果去北京旅行，你想怎么安排？", ko: "베이징에 여행 간다면 일정을 어떻게 짤 건가요?", hint: "先……再……最后……、坐高铁、订标准间" },
      { zh: "旅行的时候你遇到过什么问题吗？", ko: "여행하면서 어떤 문제를 겪어 본 적이 있나요?", hint: "差点儿、被、只要……就……" },
    ],
    "109": [
      { zh: "你无聊的时候一般做什么？", ko: "심심할 때 보통 무엇을 하나요?", hint: "不是……就是……、刷手机、短视频" },
      { zh: "你平时有什么爱好？", ko: "평소에 어떤 취미가 있나요?", hint: "什么的、从来不/没、……极了" },
      { zh: "你觉得玩儿手机游戏好不好？为什么？", ko: "휴대폰 게임을 하는 건 좋다고 생각하나요? 왜 그런가요?", hint: "越来越多、沉迷于、不是……而是……、虽然……但是……" },
    ],
  };
  var ON = { "101": true, "102": true, "103": true, "104": true, "105": true, "106": true, "107": true, "108": true, "109": true };

  /* ---------- 작은 도구 ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  var synth = window.speechSynthesis;
  function say(text, rate) {
    if (!synth) return;
    synth.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    var vs = synth.getVoices();
    var v = vs.filter(function (x) { return /zh[-_]CN/i.test(x.lang); })[0] || vs.filter(function (x) { return /^zh/i.test(x.lang); })[0];
    if (v) u.voice = v;
    u.rate = rate || 0.85;
    synth.speak(u);
  }

  /* ---------- 병음 → 음절·성조 ---------- */
  var MARKS = { "ā": "a1", "á": "a2", "ǎ": "a3", "à": "a4", "ē": "e1", "é": "e2", "ě": "e3", "è": "e4", "ī": "i1", "í": "i2", "ǐ": "i3", "ì": "i4",
    "ō": "o1", "ó": "o2", "ǒ": "o3", "ò": "o4", "ū": "u1", "ú": "u2", "ǔ": "u3", "ù": "u4", "ǖ": "v1", "ǘ": "v2", "ǚ": "v3", "ǜ": "v4", "ü": "v0" };
  var FINALS = "a o e ai ei ao ou an en ang eng ong er i ia ie iao iu ian in iang ing iong u ua uo uai ui uan un uang ueng ue v ve van vn".split(" ");
  var INITIALS = "zh ch sh b p m f d t n l g k h j q x r z c s y w".split(" ");
  var FSET = {};
  FINALS.forEach(function (f) { FSET[f] = 1; });
  function validSyl(s) {
    if (FSET[s]) return /^[aoe]/.test(s);
    for (var i = 0; i < INITIALS.length; i++) {
      var ini = INITIALS[i];
      if (s.indexOf(ini) === 0 && FSET[s.slice(ini.length)]) return true;
    }
    return false;
  }
  /* 한 단어(예: xuanhao)를 음절로 나눔. 음절 수가 가장 적은 나눔을 고름. 끝의 r(얼화)도 허용 */
  function splitWord(base) {
    var n = base.length, best = [];
    best[0] = [];
    for (var i = 1; i <= n; i++) {
      for (var j = Math.max(0, i - 7); j < i; j++) {
        if (!best[j]) continue;
        var s = base.slice(j, i), er = false;
        if (!validSyl(s)) {
          if (s.length > 2 && s.charAt(s.length - 1) === "r" && validSyl(s.slice(0, -1))) er = true;
          else continue;
        }
        var cand = best[j].concat([{ a: j, b: i, er: er }]);
        if (!best[i] || cand.length < best[i].length) best[i] = cand;
      }
    }
    return best[n] || null;
  }
  function parsePinyin(py) {
    var out = [];
    var words = String(py || "").toLowerCase().split(/[^a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]+/);
    for (var w = 0; w < words.length; w++) {
      var word = words[w];
      if (!word) continue;
      var base = "", tones = [];
      for (var k = 0; k < word.length; k++) {
        var m = MARKS[word.charAt(k)];
        base += m ? m.charAt(0) : word.charAt(k);
        tones.push(m ? Number(m.charAt(1)) : 0);
      }
      var parts = splitWord(base);
      if (!parts) return null;
      parts.forEach(function (p) {
        var t = 0;
        for (var q = p.a; q < p.b; q++) if (tones[q]) t = tones[q];
        out.push({ py: word.slice(p.a, p.b), tone: t, er: p.er });
      });
    }
    return out;
  }
  /* 글자와 음절을 짝지음. 성조 변화(3성+3성, 不, 一)도 반영 */
  function syllables(zh, py) {
    var sy = parsePinyin(py);
    if (!sy) return null;
    var chars = String(zh).match(/[㐀-鿿]/g) || [];
    var res = [], ci = 0;
    for (var i = 0; i < sy.length; i++) {
      if (ci >= chars.length) return null;
      var ch = chars[ci++];
      /* 얼화(这儿 zhèr): 음절 끝 r + 다음 글자 儿 */
      if (chars[ci] === "儿" && /r$/.test(sy[i].py) && sy[i].py.length > 2 && ch !== "儿") ch += chars[ci++];
      res.push({ ch: ch, py: sy[i].py, tone: sy[i].tone, base: sy[i].tone });
    }
    if (ci !== chars.length) return null;
    /* 구두점에서 끊어 읽으므로, 구 끝 표시 */
    var phrases = String(zh).split(/[，。！？、,.!?；;：:]/).map(function (s) { return (s.match(/[㐀-鿿]/g) || []).length; });
    var idx = 0;
    phrases.forEach(function (len) {
      idx += len;
      if (len && res[idx - 1]) res[idx - 1].end = true;
    });
    for (i = 0; i < res.length; i++) {
      var nx = res[i + 1];
      if (res[i].ch === "不" && nx && nx.base === 4) res[i].tone = 2;
      if (res[i].ch === "一" && nx && !res[i].end && !(res[i - 1] && res[i - 1].ch === "第")) res[i].tone = nx.base === 4 ? 2 : 4;
    }
    for (i = res.length - 2; i >= 0; i--) {
      if (res[i].tone === 3 && res[i + 1].tone === 3 && !res[i].end) res[i].tone = 2;
    }
    for (i = 0; i < res.length; i++) {
      if (res[i].tone === 3) res[i].half = !res[i].end && res[i + 1] && res[i + 1].tone !== 0;
    }
    return res;
  }
  /* 성조 모양: 5도 표기 [시작, (가운데), 끝] */
  function shape(s, prev) {
    if (s.tone === 1) return [5, 5];
    if (s.tone === 2) return [3, 5];
    if (s.tone === 3) return s.half ? [2, 1, 1] : [2, 1, 4];
    if (s.tone === 4) return [5, 1];
    var lv = { 1: 2, 2: 3, 3: 4, 4: 1 }[prev ? prev.tone : 0] || 3;
    return [lv, lv];
  }

  /* ---------- 음높이 찾기 (NSDF, 브라우저 안에서만) ---------- */
  function detect(buf, sr) {
    var n = buf.length, rms = 0, i;
    for (i = 0; i < n; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / n);
    if (rms < 0.012) return 0;
    var minLag = Math.floor(sr / 480), maxLag = Math.floor(sr / 70), W = n - maxLag;
    if (W < 256) return 0;
    var nsdf = new Float32Array(maxLag + 2), max = 0;
    for (var lag = minLag; lag <= maxLag + 1; lag++) {
      var ac = 0, e = 0;
      for (i = 0; i < W; i++) {
        var a = buf[i], b = buf[i + lag];
        ac += a * b;
        e += a * a + b * b;
      }
      nsdf[lag] = e ? (2 * ac) / e : 0;
      if (nsdf[lag] > max) max = nsdf[lag];
    }
    if (max < 0.6) return 0;
    for (lag = minLag + 1; lag <= maxLag; lag++) {
      if (nsdf[lag] >= 0.88 * max && nsdf[lag] >= nsdf[lag - 1] && nsdf[lag] >= nsdf[lag + 1]) {
        var y0 = nsdf[lag - 1], y1 = nsdf[lag], y2 = nsdf[lag + 1];
        var d = y0 - 2 * y1 + y2, shift = d ? (0.5 * (y0 - y2)) / d : 0;
        return sr / (lag + shift);
      }
    }
    return 0;
  }
  function median(a) {
    var s = a.slice().sort(function (x, y) { return x - y; });
    return s.length ? s[Math.floor(s.length / 2)] : 0;
  }
  /* 반음 단위로 바꾸고, 튀는 값(옥타브 오류)을 걸러 매끄럽게 */
  function clean(frames) {
    var st = frames.map(function (f) { return f.hz ? 12 * Math.log(f.hz / 100) / Math.LN2 : null; });
    var out = st.map(function (v, i) {
      if (v == null) return null;
      var nb = [];
      for (var k = i - 3; k <= i + 3; k++) if (st[k] != null) nb.push(st[k]);
      var m = median(nb);
      return Math.abs(v - m) > 5 ? null : v;
    });
    /* 홀로 떨어진 짧은 조각 지우기 */
    for (var i = 0; i < out.length; i++) {
      if (out[i] == null) continue;
      var j = i;
      while (j < out.length && out[j] != null) j++;
      if (j - i < 3) for (var k = i; k < j; k++) out[k] = null;
      i = j;
    }
    return out.map(function (v, i) {
      if (v == null) return null;
      var nb = [];
      for (var k = i - 2; k <= i + 2; k++) if (out[k] != null) nb.push(out[k]);
      return median(nb);
    });
  }

  /* ---------- 그리기 ---------- */
  function css(name, fb) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return (v && v.trim()) || fb;
  }
  function draw(box) {
    var cv = box.querySelector(".sp-cv");
    var wrap = cv.parentElement;
    var W = wrap.clientWidth || 600, H = 230, dpr = window.devicePixelRatio || 1;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + "px"; cv.style.height = H + "px";
    var g = cv.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    var L = 30, R = W - 10, T = 14, B = H - 44;
    function yOf(level) { return B - ((level - 1) / 4) * (B - T); }
    var ink = css("--text-soft", "#7a6a5a"), line = css("--line", "#e6dccb");
    g.font = "11px sans-serif";
    g.fillStyle = ink;
    g.textAlign = "right";
    g.textBaseline = "middle";
    for (var lv = 1; lv <= 5; lv++) {
      g.strokeStyle = line;
      g.lineWidth = 1;
      g.beginPath(); g.moveTo(L, yOf(lv)); g.lineTo(R, yOf(lv)); g.stroke();
      g.fillText(String(lv), L - 8, yOf(lv));
    }
    var sy = box._sy, cur = box._curve, frames = box._frames || [];
    /* 목소리가 난 구간 */
    var first = -1, last = -1;
    if (cur) for (var i = 0; i < cur.length; i++) if (cur[i] != null) { if (first < 0) first = i; last = i; }
    var live = box._recording;
    var span0 = 0, span1 = 1;
    if (first >= 0 && !live) { span0 = frames[first].t; span1 = frames[last].t; }
    if (live) { span0 = 0; span1 = Math.max(4, frames.length ? frames[frames.length - 1].t : 0); }
    if (span1 - span0 < 0.3) span1 = span0 + 0.3;
    function xOf(t) { return L + ((t - span0) / (span1 - span0)) * (R - L); }

    /* 교과서 성조 모양 (회색 띠) */
    if (sy && !live) {
      var wsum = 0;
      sy.forEach(function (s) { wsum += s.tone === 0 ? 0.55 : 1; });
      var x = L, seg = box._seg;
      g.textAlign = "center";
      g.textBaseline = "alphabetic";
      sy.forEach(function (s, k) {
        var w = ((s.tone === 0 ? 0.55 : 1) / wsum) * (R - L);
        /* 녹음이 있으면 실제로 그 글자를 읽은 시간 위치에 그림 */
        if (seg && seg[k]) { x = xOf(seg[k].t0); w = Math.max(4, xOf(seg[k].t1) - x); }
        var sh = shape(s, sy[k - 1]);
        g.strokeStyle = "rgba(120, 140, 170, 0.35)";
        g.lineWidth = 9;
        g.lineCap = "round";
        g.beginPath();
        var pad = Math.min(8, w * 0.18);
        sh.forEach(function (lv, p) {
          var px = x + pad + ((w - 2 * pad) * p) / (sh.length - 1);
          if (p === 0) g.moveTo(px, yOf(lv)); else g.lineTo(px, yOf(lv));
        });
        g.stroke();
        if (k) {
          g.strokeStyle = line; g.lineWidth = 1;
          g.setLineDash([3, 3]);
          g.beginPath(); g.moveTo(x, T); g.lineTo(x, B); g.stroke();
          g.setLineDash([]);
        }
        var mk = box._marks && box._marks[k];
        g.fillStyle = mk === "ok" ? "#2f8a55" : mk === "half" ? "#c98a12" : mk === "miss" ? "#d2463a" : css("--text", "#3b2f25");
        g.font = (mk ? "bold " : "") + "15px sans-serif";
        g.fillText(s.ch, x + w / 2, B + 19);
        g.fillStyle = ink;
        g.font = "11px sans-serif";
        g.fillText(s.py + (s.tone !== s.base ? "→" + s.tone + "성" : ""), x + w / 2, B + 34);
        x += w;
      });
    }

    /* 내 목소리 곡선 (빨간 선): 내 목소리 범위를 1~5로 맞춤 */
    if (cur && first >= 0) {
      var vals = cur.filter(function (v) { return v != null; }).sort(function (a, b) { return a - b; });
      var lo = vals[Math.floor(vals.length * 0.05)], hi = vals[Math.floor(vals.length * 0.95)];
      if (live && box._range) { lo = box._range[0]; hi = box._range[1]; }
      if (hi - lo < 6) { var mid = (hi + lo) / 2; lo = mid - 3; hi = mid + 3; }
      g.strokeStyle = "#d2463a";
      g.lineWidth = 3;
      g.lineJoin = "round";
      g.lineCap = "round";
      var pen = false;
      g.beginPath();
      for (i = 0; i < cur.length; i++) {
        if (cur[i] == null) { pen = false; continue; }
        var lvl = 1 + (4 * (cur[i] - lo)) / (hi - lo);
        lvl = Math.max(0.6, Math.min(5.4, lvl));
        var px = xOf(frames[i].t), py = yOf(lvl);
        if (!pen) { g.moveTo(px, py); pen = true; } else g.lineTo(px, py);
      }
      g.stroke();
    } else if (!live) {
      g.fillStyle = ink;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.font = "13px sans-serif";
      g.fillText(box._frames ? "목소리를 찾지 못했어요. 마이크 가까이에서 또박또박 다시 읽어 보세요." : "🎙️ 녹음을 누르고 문장을 읽으면 내 성조 곡선(빨간 선)이 그려져요.", (L + R) / 2, (T + B) / 2);
    }
  }

  /* ---------- 글자 나누기: 쉰 곳·소리가 약해진 곳을 글자 경계로 ---------- */
  var BW = 2, DW = 2;
  function segment(box) {
    var sy = box._sy, cur = box._curve, fr = box._frames;
    if (!sy || !cur || !fr) return null;
    var i0 = -1, i1 = -1, i;
    for (i = 0; i < cur.length; i++) if (cur[i] != null) { if (i0 < 0) i0 = i; i1 = i; }
    var N = sy.length, n = i1 - i0 + 1;
    if (i0 < 0 || n < N * 2) return null;
    var wt = sy.map(function (s, k) { return s.tone === 0 ? 0.6 : s.end && k < N - 1 ? 1.25 : 1; });
    var W = wt.reduce(function (a, b) { return a + b; }, 0);
    var E = wt.map(function (w) { return (n * w) / W; });
    /* 경계 비용: 소리가 없는 곳 0, 약해진 곳은 낮게, 또렷한 소리 한가운데는 높게 */
    var bc = new Float32Array(n + 1);
    for (var j = 0; j <= n; j++) {
      var f = i0 + j;
      if (j === 0 || j === n || cur[f] == null) { bc[j] = 0; continue; }
      var mx = 0;
      for (var q = Math.max(i0, f - 6); q <= Math.min(i1, f + 6); q++) mx = Math.max(mx, fr[q].e || 0);
      var re = mx ? (fr[f].e || 0) / mx : 1;
      bc[j] = BW * (0.1 + 0.9 * re * re);
    }
    /* 글자 안쪽에 소리가 끊긴 곳(3프레임 이상)이 있으면 경계를 놓친 것: 그 개수를 셀 수 있게 누적 */
    var gs = new Int32Array(n + 1);
    for (j = 0; j < n; j++) {
      var f2 = i0 + j, st = cur[f2] == null && j > 0 && cur[f2 - 1] != null && cur[f2 + 1] == null && cur[f2 + 2] == null;
      gs[j + 1] = gs[j] + (st ? 1 : 0);
    }
    var INF = 1e9, D = [], P = [];
    for (var k = 0; k <= N; k++) { D.push(new Float64Array(n + 1).fill(INF)); P.push(new Int32Array(n + 1)); }
    D[0][0] = 0;
    for (k = 1; k <= N; k++) {
      var e = E[k - 1], mn = Math.max(2, Math.floor(0.35 * e)), mxl = Math.max(mn + 1, Math.ceil(2.6 * e));
      var endPh = sy[k - 1].end && k < N;
      for (j = 1; j <= n; j++) {
        var b = k < N ? bc[j] * (endPh ? 3 : 1) : 0;
        for (var len = mn; len <= mxl && len <= j; len++) {
          var pv = D[k - 1][j - len];
          if (pv >= INF) continue;
          var r = (len - e) / e, c = pv + DW * r * r + b + (gs[j - 1] - gs[j - len + 1]);
          if (c < D[k][j]) { D[k][j] = c; P[k][j] = j - len; }
        }
      }
    }
    if (D[N][n] >= INF) return null;
    var cuts = [n];
    for (k = N, j = n; k > 0; k--) { j = P[k][j]; cuts.unshift(j); }
    var tOf = function (j) { return fr[Math.min(i1, i0 + j)].t; };
    var out = [];
    for (k = 0; k < N; k++) out.push({ a: i0 + cuts[k], b: i0 + cuts[k + 1], t0: tOf(cuts[k]), t1: tOf(cuts[k + 1]) });
    return out;
  }

  /* ---------- 성조 채점 (너그럽게, 참고용) ---------- */
  function judge(box) {
    var sy = box._sy, cur = box._curve, seg = box._seg, fr = box._frames;
    box._marks = null;
    if (!sy || !cur || !seg) return null;
    var all = cur.filter(function (v) { return v != null; }).sort(function (a, b) { return a - b; });
    var lo = all[Math.floor(all.length * 0.05)], hi = all[Math.floor(all.length * 0.95)], span = hi - lo;
    if (span < 6) { var md = (hi + lo) / 2; lo = md - 3; hi = md + 3; }
    var lv = function (v) { return 1 + (4 * (v - lo)) / (hi - lo); };
    var avg = function (a) { return a.reduce(function (x, y) { return x + y; }, 0) / a.length; };
    var marks = [], issues = {}, pts = 0, cnt = 0;
    sy.forEach(function (s, k) {
      var g = seg[k], v = [];
      var a = g.a + Math.floor((g.b - g.a) * 0.15), b = g.b - Math.floor((g.b - g.a) * 0.1);
      for (var i = a; i < b; i++) if (cur[i] != null) v.push(cur[i]);
      if (s.tone === 0 || v.length < 3) { marks.push(null); return; }
      var th = Math.max(1, Math.floor(v.length / 3));
      var st = avg(v.slice(0, th)), en = avg(v.slice(-th)), d = en - st;
      var mean = lv(avg(v)), low = lv(Math.min.apply(null, v));
      var m = "miss", why = null;
      if (s.tone === 1) {
        if (Math.abs(d) < 2.5 && mean >= 3) m = "ok";
        else if (Math.abs(d) < 4 && mean >= 2.3) m = "half";
        why = mean < 3 ? "t1low" : "t1move";
      } else if (s.tone === 2) {
        m = d >= 1.8 ? "ok" : d >= 0.7 ? "half" : "miss"; why = "t2";
      } else if (s.tone === 4) {
        m = d <= -2.5 ? "ok" : d <= -1.2 ? "half" : "miss"; why = "t4";
      } else if (s.tone === 3) {
        if (s.half) m = mean <= 2.6 && d < 2.5 ? "ok" : mean <= 3.3 ? "half" : "miss";
        else m = low <= 2.2 ? "ok" : low <= 3 ? "half" : "miss";
        why = "t3";
      }
      marks.push(m);
      cnt++;
      pts += m === "ok" ? 1 : m === "half" ? 0.6 : 0;
      if (m !== "ok") { issues[why] = issues[why] || []; if (issues[why].indexOf(s.ch) < 0) issues[why].push(s.ch); }
    });
    box._marks = marks;
    var toned = sy.filter(function (s) { return s.tone !== 0; }).length;
    if (!cnt || cnt < toned / 2) return { none: true };
    var ratio = pts / cnt;
    var score = ratio >= 0.85 ? 5 : ratio >= 0.7 ? 4 : ratio >= 0.5 ? 3 : ratio >= 0.3 ? 2 : 1;
    var TIP = {
      t4: "4성: 높은 데서 시작해 아래로 '뚝' 떨어뜨려 보세요.",
      t2: "2성: 중간에서 시작해 위로 쭉 올려 보세요. (\"응?\" 하고 되묻듯이)",
      t1low: "1성: 처음부터 끝까지 높게 유지해 보세요.",
      t1move: "1성: 높이가 흔들렸어요. 높은 음을 평평하게 끌어 보세요.",
      t3: "3성: 더 낮게 눌러 읽어 보세요. 뒤에 다른 글자가 오면 낮게만 내고 올리지 않아요.",
    };
    var tips = Object.keys(issues).sort(function (x, y) { return issues[y].length - issues[x].length; }).slice(0, 3).map(function (key) {
      return TIP[key] + " (" + issues[key].join(", ") + ")";
    });
    var i0 = -1;
    for (var i = 0; i < cur.length; i++) if (cur[i] != null) { i0 = i; break; }
    if (i0 >= 0 && fr[i0].t < 0.25) tips.push("첫 글자가 잘렸을 수 있어요. 🎙️을 누르고 '읽어 보세요'가 나온 뒤 읽어 주세요.");
    if (span < 5 && score < 5) tips.push("목소리 높낮이 폭이 좁아요. 1성은 더 높게, 3성은 더 낮게 조금 과장해서 읽어 보세요.");
    var dur = seg[seg.length - 1].t1 - seg[0].t0;
    if (dur / sy.length < 0.13) tips.push("조금 더 천천히, 한 글자씩 또박또박 읽으면 더 정확하게 잡혀요.");
    var COMMENT = {
      5: "아주 좋아요! 성조 모양이 교과서와 거의 같아요.",
      4: "잘했어요. 몇 글자만 다듬으면 완벽해요.",
      3: "성조 흐름은 잘 잡혔어요. 색이 다른 글자를 원어민 소리와 비교해 보세요.",
      2: "성조가 조금 평평하게 들려요. 높낮이를 더 크게 넣어 보세요.",
      1: "원어민 소리를 몇 번 더 듣고, 천천히 따라 읽어 보세요.",
    };
    return { score: score, comment: COMMENT[score], tips: tips };
  }
  function showScore(box, r) {
    var el = box.querySelector(".sp-score");
    if (!el) return;
    if (!r) { el.hidden = true; el.innerHTML = ""; return; }
    el.hidden = false;
    if (r.none) { el.innerHTML = '<p class="sp-sc-cmt">목소리가 충분히 잡히지 않아 점수를 매기지 못했어요. 마이크 가까이에서 천천히 다시 읽어 보세요.</p>'; return; }
    el.innerHTML =
      '<div class="sp-sc-head"><b>성조 점수</b> <span class="sp-stars" aria-hidden="true">' + "★★★★★".slice(0, r.score) + '<i>' + "★★★★★".slice(r.score) + "</i></span> <b>" + r.score + " / 5</b></div>" +
      '<p class="sp-sc-cmt">' + esc(r.comment) + "</p>" +
      (r.tips.length ? '<div class="sp-sc-tips"><b>주의할 점</b><ul>' + r.tips.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul></div>" : "") +
      '<p class="sp-sc-note">글자 색: <span style="color:#2f8a55">맞음</span> · <span style="color:#c98a12">조금 아쉬움</span> · <span style="color:#d2463a">다시 연습</span> · 참고용 점수예요(마이크·주변 소리에 따라 달라질 수 있어요).</p>';
  }

  /* ---------- 녹음 ---------- */
  var active = null;
  function stopRec(box) {
    if (!box || !box._recording) return;
    box._recording = false;
    cancelAnimationFrame(box._raf);
    try { if (box._mr && box._mr.state !== "inactive") box._mr.stop(); } catch (e) {}
    if (box._stream) box._stream.getTracks().forEach(function (t) { t.stop(); });
    if (box._ctx) box._ctx.close();
    box._curve = clean(box._frames || []);
    box._seg = segment(box);
    showScore(box, judge(box));
    var btn = box.querySelector(".sp-rec");
    btn.textContent = "🎙️ 다시 녹음";
    btn.classList.remove("is-on");
    box.querySelector(".sp-msg").textContent = box._curve.some(function (v) { return v != null; })
      ? "회색 띠 = 교과서 성조 모양, 빨간 선 = 내 목소리. 아래에서 점수와 주의할 점을 확인하세요."
      : "";
    draw(box);
    active = null;
  }
  function startRec(box) {
    if (active && active !== box) stopRec(active);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      box.querySelector(".sp-msg").textContent = "이 브라우저에서는 마이크를 쓸 수 없어요. 크롬이나 엣지에서 열어 주세요.";
      return;
    }
    if (synth) synth.cancel();
    var msg = box.querySelector(".sp-msg");
    msg.textContent = "마이크를 여는 중…";
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }).then(function (stream) {
      var AC = window.AudioContext || window.webkitAudioContext;
      var ctx = new AC();
      var src = ctx.createMediaStreamSource(stream);
      var an = ctx.createAnalyser();
      an.fftSize = 2048;
      src.connect(an);
      var buf = new Float32Array(an.fftSize);
      box._stream = stream; box._ctx = ctx; box._frames = []; box._curve = []; box._range = null; box._seg = null; box._marks = null;
      showScore(box, null);
      box._recording = true;
      active = box;
      var chunks = [];
      try {
        box._mr = new MediaRecorder(stream);
        box._mr.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data); };
        box._mr.onstop = function () {
          if (box._url) URL.revokeObjectURL(box._url);
          box._url = URL.createObjectURL(new Blob(chunks, { type: box._mr.mimeType || "audio/webm" }));
          box.querySelector(".sp-mine").disabled = false;
        };
        box._mr.start();
      } catch (e) { box._mr = null; }
      var btn = box.querySelector(".sp-rec");
      btn.textContent = "⏹ 멈춤";
      btn.classList.add("is-on");
      msg.textContent = "읽어 보세요… (다 읽고 잠시 조용하면 저절로 멈춰요)";
      var t0 = ctx.currentTime, lastVoice = -1, everVoice = false;
      (function tick() {
        if (!box._recording) return;
        an.getFloatTimeDomainData(buf);
        var t = ctx.currentTime - t0;
        var hz = detect(buf, ctx.sampleRate);
        var en = 0;
        for (var q = 0; q < buf.length; q++) en += buf[q] * buf[q];
        box._frames.push({ t: t, hz: hz, e: Math.sqrt(en / buf.length) });
        if (hz) { lastVoice = t; everVoice = true; }
        box._curve = clean(box._frames);
        if (!box._range) {
          var v = box._curve.filter(function (x) { return x != null; });
          if (v.length > 15) { var m = median(v); box._range = [m - 4, m + 4]; }
        }
        draw(box);
        if ((everVoice && t - lastVoice > 1.4) || t > 15) return stopRec(box);
        box._raf = requestAnimationFrame(tick);
      })();
    }, function () {
      msg.textContent = "마이크를 쓸 수 없어요. 주소창 왼쪽의 🔒(사이트 설정)에서 마이크를 '허용'으로 바꿔 주세요.";
    });
  }

  /* ---------- 자유 말하기 (크롬 음성 인식) ---------- */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var LIMIT = 60;
  function stopTalk(box) {
    if (!box._talk) return;
    box._talk.on = false;
    clearInterval(box._talk.timer);
    try { box._talk.rec.stop(); } catch (e) {}
    var btn = box.querySelector(".sp-talk");
    btn.textContent = "🎤 다시 말하기";
    btn.classList.remove("is-on");
    box.querySelector(".sp-time").textContent = "";
    count(box);
  }
  function count(box) {
    var ta = box.querySelector(".sp-text");
    var n = (ta.value.match(/[㐀-鿿]/g) || []).length;
    box.querySelector(".sp-count").textContent = n ? "한자 " + n + "자" : "";
  }
  function startTalk(box) {
    if (!SR) {
      box.querySelector(".sp-talk-msg").textContent = "이 브라우저는 음성 받아쓰기를 지원하지 않아요. 크롬이나 엣지에서 열어 주세요. (직접 입력해도 돼요)";
      return;
    }
    if (active) stopRec(active);
    var ta = box.querySelector(".sp-text");
    var keep = ta.value ? ta.value.replace(/\s+$/, "") : "";
    var rec = new SR();
    rec.lang = "zh-CN";
    rec.continuous = true;
    rec.interimResults = true;
    var talk = { on: true, rec: rec, start: Date.now(), done: keep };
    box._talk = talk;
    rec.onresult = function (e) {
      var fin = "", tmp = "";
      for (var i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) fin += e.results[i][0].transcript;
        else tmp += e.results[i][0].transcript;
      }
      talk.done += fin;
      ta.value = talk.done + tmp;
      count(box);
    };
    rec.onerror = function (e) {
      if (e.error === "not-allowed") {
        box.querySelector(".sp-talk-msg").textContent = "마이크를 쓸 수 없어요. 주소창 왼쪽의 🔒에서 마이크를 '허용'으로 바꿔 주세요.";
        stopTalk(box);
      }
    };
    /* 크롬은 조용하면 저절로 끝나므로, 시간이 남았으면 다시 켬 */
    rec.onend = function () {
      if (talk.on && Date.now() - talk.start < LIMIT * 1000) { try { rec.start(); } catch (e) {} }
      else if (talk.on) stopTalk(box);
    };
    try { rec.start(); } catch (e) {}
    var btn = box.querySelector(".sp-talk");
    btn.textContent = "⏹ 그만 말하기";
    btn.classList.add("is-on");
    box.querySelector(".sp-talk-msg").textContent = "";
    var time = box.querySelector(".sp-time");
    talk.timer = setInterval(function () {
      var s = Math.floor((Date.now() - talk.start) / 1000);
      time.textContent = "⏱ " + s + "초 / " + LIMIT + "초";
      if (s >= LIMIT) stopTalk(box);
    }, 250);
    time.textContent = "⏱ 0초 / " + LIMIT + "초";
  }

  /* ---------- AI 평가 (학생 자기 API 키) ---------- */
  function store(keep) {
    try { return keep ? window.localStorage : window.sessionStorage; } catch (e) { return null; }
  }
  function getKey() {
    var k = null;
    try { k = window.localStorage.getItem(KEY_NAME); } catch (e) {}
    if (!k) try { k = window.sessionStorage.getItem(KEY_NAME); } catch (e) {}
    return k || "";
  }
  function setKey(k, keep) {
    try { window.localStorage.removeItem(KEY_NAME); } catch (e) {}
    try { window.sessionStorage.removeItem(KEY_NAME); } catch (e) {}
    var st = store(keep);
    if (k && st) try { st.setItem(KEY_NAME, k); } catch (e) {}
    MEMKEY = k || "";
  }
  var MEMKEY = "";
  function key() { return getKey() || MEMKEY; }
  function vendor(k) {
    if (/^sk-ant-/.test(k)) return "claude";
    if (/^AIza/.test(k)) return "gemini";
    if (/^sk-/.test(k)) return "openai";
    return "";
  }
  var VNAME = { claude: "Claude", openai: "ChatGPT", gemini: "Gemini" };

  function evalPrompt(n, q, text) {
    var L = LESSON_INFO[String(n)] || ["교양중국어2", ""];
    return [
      "당신은 한국 대학생에게 중국어를 가르치는 친절한 교수입니다. 교양중국어2(초중급, HSK 2~3급 정도) 학생의 말하기를 평가하세요.",
      "",
      "[이번 과] " + L[0],
      "[이번 과 핵심 표현] " + L[1],
      "[질문] " + (q ? q.zh + " (" + q.ko + ")" : "자유 주제"),
      "[학생이 말한 내용 — 음성 인식으로 받아 적은 글]",
      text,
      "",
      "평가 규칙:",
      "- 점수는 이 학생의 단계(교양중국어2) 기준으로 매기세요. 질문에 맞게 이 단계에서 기대만큼 말했으면 4점, 이번 과 표현을 잘 쓰고 거의 틀리지 않았으면 5점, 3점 이하는 뜻이 잘 통하지 않을 때만 주세요. 작은 실수는 점수 대신 errors에서 짚으세요.",
      "- 이 글은 음성 인식 결과입니다. 문맥상 어색한 글자는 발음·성조 때문에 잘못 인식됐을 가능성이 큽니다. 그런 곳은 type을 \"발음 추정\"으로 하고, 말하려던 단어와 병음(성조 표시)을 fixed·pinyin에, 헷갈렸을 소리를 why에 짧게 적으세요. 문법 오류로 세지 마세요.",
      "- 발음·성조 점수는 소리를 직접 듣지 않고 인식 결과로 추정한 것임을 comment에 드러내세요.",
      "- 문장부호가 없거나 띄어쓰기가 이상한 것은 음성 인식 때문이므로 지적하지 마세요.",
      "- original은 학생 글에서 그대로 옮긴 구절, fixed는 고친 구절, pinyin은 고친 구절의 병음(성조 표시)입니다.",
      "- type은 다음 중 하나: 문법, 어순, 어휘, 양사, 호응, 발음 추정, 내용",
      "- 이번 과 핵심 표현을 썼으면 good에서 칭찬하고, 쓰지 않았으면 summary에서 하나쯤 권하세요.",
      "- 설명은 모두 쉬운 한국어로, 학생에게 직접 말하듯 짧게 쓰세요.",
      "- better는 학생 내용을 살려 자연스럽게 다듬은 전체 답변(같은 수준의 어휘)입니다.",
      "",
      "다음 JSON 하나만 답하세요(다른 글 없이):",
      '{"level":"HSK n급 수준 같은 한 줄","summary":"두세 문장 총평","scores":[{"label":"발음·성조 (추정)","score":1~5,"comment":"..."},{"label":"어휘","score":1~5,"comment":"..."},{"label":"단어 정확도","score":1~5,"comment":"..."},{"label":"문법 정확도","score":1~5,"comment":"..."}],"errors":[{"type":"...","original":"...","fixed":"...","pinyin":"...","why":"..."}],"good":["..."],"better":{"zh":"...","pinyin":"...","ko":"..."}}',
    ].join("\n");
  }

  function AIError(code, status) { this.code = code; this.status = status; }
  function httpErr(r) {
    return r.text().then(function (t) {
      var code = r.status === 401 || r.status === 403 ? "key" : r.status === 429 ? "limit" : r.status === 404 || /model/i.test(t) && r.status === 400 ? "model" : "server";
      if (r.status === 400 && /api[_ ]?key|API key not valid/i.test(t)) code = "key";
      throw new AIError(code, r.status);
    });
  }
  /* 회사별로 부르기. 모델 이름이 없다고 하면 다음 후보로 */
  var MODELS = {
    claude: ["claude-sonnet-5-5", "claude-haiku-5-5", "claude-sonnet-4-5", "claude-haiku-4-5"],
    openai: ["gpt-5-mini", "gpt-4.1-mini", "gpt-4o-mini"],
    gemini: ["gemini-2.5-flash", "gemini-2.0-flash"],
  };
  function callOnce(v, k, model, prompt, signal) {
    var req;
    if (v === "claude") {
      req = fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", signal: signal,
        headers: { "content-type": "application/json", "x-api-key": k, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: model, max_tokens: 2000, messages: [{ role: "user", content: prompt }] }),
      }).then(function (r) { return r.ok ? r.json() : httpErr(r); }).then(function (j) {
        return (j.content || []).map(function (c) { return c.text || ""; }).join("");
      });
    } else if (v === "openai") {
      req = fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST", signal: signal,
        headers: { "content-type": "application/json", authorization: "Bearer " + k },
        body: JSON.stringify({ model: model, response_format: { type: "json_object" }, messages: [{ role: "user", content: prompt }] }),
      }).then(function (r) { return r.ok ? r.json() : httpErr(r); }).then(function (j) {
        return ((j.choices || [])[0] || {}).message ? j.choices[0].message.content : "";
      });
    } else {
      req = fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent", {
        method: "POST", signal: signal,
        headers: { "content-type": "application/json", "x-goog-api-key": k },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } }),
      }).then(function (r) { return r.ok ? r.json() : httpErr(r); }).then(function (j) {
        var c = (j.candidates || [])[0];
        return c && c.content ? (c.content.parts || []).map(function (p) { return p.text || ""; }).join("") : "";
      });
    }
    return req.catch(function (e) {
      if (e instanceof AIError || (e && e.name === "AbortError")) throw e;
      throw new AIError("net");
    });
  }
  function callAI(k, prompt, signal) {
    var v = vendor(k), list = MODELS[v] || [], i = 0;
    function next() {
      return callOnce(v, k, list[i], prompt, signal).catch(function (e) {
        if (e && e.code === "model" && ++i < list.length) return next();
        throw e;
      });
    }
    return next().then(function (txt) {
      var m = String(txt || "").match(/\{[\s\S]*\}/);
      if (!m) throw new AIError("json");
      try { return JSON.parse(m[0]); } catch (e) { throw new AIError("json"); }
    });
  }
  function renderResult(r) {
    var scores = Array.isArray(r.scores) ? r.scores : [], errs = Array.isArray(r.errors) ? r.errors : [];
    var good = Array.isArray(r.good) ? r.good : [], b = r.better || {};
    return '<div class="sp-res">' +
      '<div class="sp-res-lv">' + esc(r.level || "") + "</div>" +
      '<p class="sp-res-sum">' + esc(r.summary || "") + "</p>" +
      '<div class="sp-res-scores">' + scores.map(function (x) {
        var n = Math.max(0, Math.min(5, Math.round(Number(x.score) || 0)));
        return '<div class="sp-rs"><span class="sp-rs-lab">' + esc(x.label) + '</span><span class="sp-rs-bar"><span style="width:' + n * 20 + '%"></span></span><b>' + n + '/5</b><span class="sp-rs-cmt">' + esc(x.comment) + "</span></div>";
      }).join("") + "</div>" +
      "<h6>고칠 곳 " + errs.length + "개</h6>" +
      (errs.length ? '<ul class="sp-errs">' + errs.map(function (e) {
        return '<li><div class="sp-err-type">' + esc(e.type) + '</div><div class="sp-err-from" lang="zh-CN">' + esc(e.original) + '</div><div class="sp-err-to" lang="zh-CN">→ ' + esc(e.fixed) + "</div>" +
          (e.pinyin ? '<div class="sp-err-py">' + esc(e.pinyin) + "</div>" : "") + '<div class="sp-err-why">' + esc(e.why) + "</div></li>";
      }).join("") + "</ul>" : '<p class="sp-desc">틀린 곳이 없어요. 아주 잘했어요!</p>') +
      (good.length ? "<h6>잘한 점</h6><ul class=\"sp-good\">" + good.map(function (g) { return "<li>" + esc(g) + "</li>"; }).join("") + "</ul>" : "") +
      (b.zh ? '<h6>이렇게 말하면 더 자연스러워요</h6><div class="sp-better" lang="zh-CN">' + esc(b.zh) + '</div><div class="sp-err-py">' + esc(b.pinyin) + '</div><div class="sp-desc">' + esc(b.ko) + "</div>" : "") +
      "</div>";
  }
  function keyInfo(box) {
    var k = key(), el = box.querySelector(".sp-keyinfo");
    if (!el) return;
    el.innerHTML = k
      ? '🔑 키 저장됨 (' + esc(VNAME[vendor(k)] || "?") + " …" + esc(k.slice(-4)) + ') <button type="button" class="sp-link sp-keyedit">바꾸기</button> <button type="button" class="sp-link sp-keydel">지우기</button>'
      : '<button type="button" class="sp-link sp-keyedit">🔑 내 API 키 넣기</button>';
  }
  function openKey(box, msg) {
    var kb = box.querySelector(".sp-keybox");
    kb.hidden = false;
    var inp = kb.querySelector(".sp-keyin");
    inp.value = "";
    inp.focus();
    box.querySelector(".sp-eval-msg").textContent = msg || "";
  }
  function saveKey(box) {
    var kb = box.querySelector(".sp-keybox");
    var k = kb.querySelector(".sp-keyin").value.trim().replace(/\s+/g, "");
    var msg = box.querySelector(".sp-eval-msg");
    if (!k) { msg.textContent = "키를 붙여 넣어 주세요."; return false; }
    if (!vendor(k)) { msg.textContent = "키 모양을 알아볼 수 없어요. sk-ant-… (Claude), sk-… (ChatGPT), AIza… (Gemini)로 시작하는 키를 넣어 주세요."; return false; }
    setKey(k, kb.querySelector(".sp-keykeep").checked);
    kb.hidden = true;
    msg.textContent = "키를 저장했어요. (" + VNAME[vendor(k)] + ")";
    document.querySelectorAll(".sp").forEach(keyInfo);
    return true;
  }
  function runEval(box, n) {
    var msg = box.querySelector(".sp-eval-msg"), out = box.querySelector(".sp-result"), btn = box.querySelector(".sp-eval");
    if (box._evalCtl) { box._evalCtl.abort(); return; }
    var text = box.querySelector(".sp-text").value.trim();
    if ((text.match(/[㐀-鿿]/g) || []).length < 5) { msg.textContent = "먼저 중국어로 조금 더 말해 주세요. (한자 5자 이상)"; return; }
    var k = key();
    if (!k) { box._pendingEval = true; openKey(box, "평가를 받으려면 먼저 학교에서 받은 API 키를 한 번 넣어 주세요."); return; }
    if (box._talk && box._talk.on) stopTalk(box);
    var p = box.querySelector(".sp-prompts input:checked");
    var q = p ? (PROMPTS[String(n)] || [])[Number(p.value)] : null;
    var ctl = window.AbortController ? new AbortController() : null;
    box._evalCtl = ctl || { abort: function () {} };
    btn.textContent = "⏹ 평가 멈추기";
    msg.textContent = "평가하는 중… (" + VNAME[vendor(k)] + ", 10~40초쯤 걸려요)";
    out.innerHTML = "";
    callAI(k, evalPrompt(n, q, text), ctl && ctl.signal).then(function (r) {
      out.innerHTML = renderResult(r);
      msg.textContent = "평가를 마쳤어요.";
      out.scrollIntoView({ behavior: "smooth", block: "start" });
    }).catch(function (e) {
      var c = e && e.code;
      msg.textContent =
        e && e.name === "AbortError" ? "평가를 멈췄어요." :
        c === "key" ? "키가 맞지 않거나 쓸 수 없는 키예요. '바꾸기'를 눌러 다시 넣어 주세요." :
        c === "limit" ? "사용 한도에 걸렸어요. 잠시 뒤에 다시 눌러 주세요." :
        c === "model" ? "이 키로 쓸 수 있는 AI 모델을 찾지 못했어요. 선생님께 알려 주세요." :
        c === "json" ? "평가 결과를 읽지 못했어요. 한 번 더 눌러 주세요." :
        c === "net" ? "AI에 연결하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요." :
        "평가 중에 문제가 생겼어요" + (e && e.status ? " (" + e.status + ")" : "") + ". 다시 눌러 주세요.";
    }).then(function () {
      box._evalCtl = null;
      btn.textContent = "🤖 AI 평가 받기";
    });
  }

  /* ---------- 화면 ---------- */
  function sentenceList(c) {
    return (c.sentences || []).filter(function (s) { return s && s.zh && s.pinyin && syllables(s.zh, s.pinyin); });
  }
  function html(n, c) {
    var ss = sentenceList(c), ps = PROMPTS[String(n)] || [];
    return (
      '<div class="sp">' +
      '<section class="sp-part sp-read">' +
      '<h5>🎵 성조 곡선 낭독 <span class="sp-tag">참고용</span></h5>' +
      '<p class="sp-desc">문장을 골라 원어민 소리를 듣고, 🎙️ 녹음을 눌러 따라 읽어 보세요. 내 목소리의 높낮이가 빨간 선으로 그려져요.</p>' +
      '<div class="sp-bar"><select class="sp-pick" aria-label="문장 고르기">' +
      ss.map(function (s, i) { return '<option value="' + i + '">' + (i + 1) + ". " + esc(s.zh) + "</option>"; }).join("") +
      "</select></div>" +
      '<div class="sp-sent"></div>' +
      '<div class="sp-bar">' +
      '<button type="button" class="sp-btn sp-native">🔊 원어민 듣기</button>' +
      '<button type="button" class="sp-btn sp-rec">🎙️ 녹음</button>' +
      '<button type="button" class="sp-btn sp-mine" disabled>▶ 내 녹음 듣기</button>' +
      "</div>" +
      '<div class="sp-cvwrap"><canvas class="sp-cv"></canvas></div>' +
      '<p class="sp-msg" aria-live="polite"></p>' +
      '<div class="sp-score" aria-live="polite" hidden></div>' +
      '<details class="sp-help"><summary>그래프 읽는 법</summary><ul>' +
      "<li>세로 1~5는 성조의 높낮이(5도 표기)예요. 1성 55(높고 평평), 2성 35(올라감), 3성 214(내려갔다 올라감), 4성 51(뚝 떨어짐).</li>" +
      "<li>3성 뒤에 3성이 오면 앞의 것을 2성으로, 3성 뒤에 다른 성조가 오면 낮게만(21) 읽어요. 그래프에 이미 반영돼 있어요.</li>" +
      "<li>글자 위치는 쉬거나 소리가 약해진 곳을 찾아 어림한 거예요. 천천히 또박또박 읽을수록 잘 맞아요.</li>" +
      "<li>점수는 글자마다 성조 모양(올라감·떨어짐·높이)이 맞는지 너그럽게 본 참고용이에요.</li>" +
      "<li>녹음은 이 컴퓨터 안에서만 쓰이고 어디에도 올라가지 않아요.</li>" +
      "</ul></details>" +
      "</section>" +
      '<section class="sp-part sp-free">' +
      '<h5>💬 자유 말하기 <span class="sp-tag">30초~1분</span></h5>' +
      '<p class="sp-desc">아래 질문 중 하나를 골라 중국어로 자유롭게 말해 보세요. 말한 내용이 글자로 받아 적혀요.</p>' +
      '<ol class="sp-prompts">' +
      ps.map(function (p, i) {
        return '<li><label><input type="radio" name="sp-p-' + n + '" value="' + i + '"' + (i ? "" : " checked") + '> <b lang="zh-CN">' + esc(p.zh) + "</b> <span>" + esc(p.ko) + '</span></label><div class="sp-hint">써 보면 좋은 표현: <span lang="zh-CN">' + esc(p.hint) + "</span></div></li>";
      }).join("") +
      "</ol>" +
      '<div class="sp-bar"><button type="button" class="sp-btn sp-talk">🎤 말하기 시작</button><span class="sp-time"></span></div>' +
      '<p class="sp-talk-msg" aria-live="polite"></p>' +
      '<textarea class="sp-text" lang="zh-CN" rows="5" placeholder="여기에 받아 적은 글이 나와요. 잘못 적힌 글자는 직접 고쳐도 돼요."></textarea>' +
      '<div class="sp-bar"><span class="sp-count"></span><button type="button" class="sp-btn sp-copy">📋 복사</button><button type="button" class="sp-btn sp-clear">지우기</button>' +
      "</div>" +
      '<div class="sp-aibox">' +
      '<div class="sp-bar"><button type="button" class="sp-btn sp-ai sp-eval">🤖 AI 평가 받기</button><span class="sp-keyinfo"></span></div>' +
      '<div class="sp-keybox" hidden>' +
      '<label class="sp-keylab">🔑 학교에서 받은 API 키를 붙여 넣으세요</label>' +
      '<div class="sp-bar"><input type="password" class="sp-keyin" autocomplete="off" spellcheck="false" placeholder="sk-ant-… / sk-… / AIza…">' +
      '<button type="button" class="sp-btn sp-keysave">저장</button><button type="button" class="sp-btn sp-keycancel">닫기</button></div>' +
      '<label class="sp-keykeep-lab"><input type="checkbox" class="sp-keykeep" checked> 이 기기에 계속 저장 (여러 사람이 쓰는 컴퓨터에서는 끄세요)</label>' +
      '<p class="sp-desc">키는 이 브라우저에만 저장되고, 평가할 때 해당 AI 회사(Claude·ChatGPT·Gemini)로만 보내져요.</p>' +
      "</div>" +
      '<p class="sp-eval-msg" aria-live="polite"></p>' +
      '<div class="sp-result" aria-live="polite"></div>' +
      "</div>" +
      "</section>" +
      "</div>"
    );
  }
  function showSentence(box) {
    var s = box._list[Number(box.querySelector(".sp-pick").value) || 0];
    if (!s) return;
    box._s = s;
    box._sy = syllables(s.zh, s.pinyin);
    box._frames = null; box._curve = null; box._seg = null; box._marks = null;
    showScore(box, null);
    box.querySelector(".sp-mine").disabled = true;
    box.querySelector(".sp-rec").textContent = "🎙️ 녹음";
    box.querySelector(".sp-msg").textContent = "";
    box.querySelector(".sp-sent").innerHTML =
      '<div class="sp-zh" lang="zh-CN">' + esc(s.zh) + "</div>" +
      '<div class="sp-py">' + esc(s.pinyin) + "</div>" +
      '<div class="sp-ko">' + esc(s.ko || "") + "</div>";
    draw(box);
  }
  function mount(el, n, c) {
    var box = el.querySelector(".sp");
    if (!box) return;
    box._list = sentenceList(c);
    showSentence(box);
    keyInfo(box);
    box.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && e.target.closest(".sp-keyin")) { e.preventDefault(); box.querySelector(".sp-keysave").click(); }
    });
    box.addEventListener("change", function (e) {
      if (e.target.closest(".sp-pick")) { if (active === box) stopRec(box); showSentence(box); }
    });
    box.addEventListener("input", function (e) { if (e.target.closest(".sp-text")) count(box); });
    box.addEventListener("click", function (e) {
      var t = e.target;
      if (t.closest(".sp-native")) return say(box._s.zh, 0.8);
      if (t.closest(".sp-rec")) return box._recording ? stopRec(box) : startRec(box);
      if (t.closest(".sp-mine")) { if (box._url) new Audio(box._url).play(); return; }
      if (t.closest(".sp-talk")) return box._talk && box._talk.on ? stopTalk(box) : startTalk(box);
      if (t.closest(".sp-clear")) { stopTalk(box); box.querySelector(".sp-text").value = ""; box._talk = null; return count(box); }
      if (t.closest(".sp-eval")) return runEval(box, n);
      if (t.closest(".sp-keyedit")) return openKey(box, "");
      if (t.closest(".sp-keycancel")) { box.querySelector(".sp-keybox").hidden = true; box._pendingEval = false; return; }
      if (t.closest(".sp-keysave")) { if (saveKey(box) && box._pendingEval) { box._pendingEval = false; runEval(box, n); } return; }
      if (t.closest(".sp-keydel")) { setKey("", false); keyInfo(box); box.querySelector(".sp-eval-msg").textContent = "이 브라우저에서 키를 지웠어요."; return; }
      if (t.closest(".sp-copy")) {
        var ta = box.querySelector(".sp-text");
        var p = box.querySelector(".sp-prompts input:checked");
        var q = p ? (PROMPTS[String(n)] || [])[Number(p.value)] : null;
        var txt = (q ? "질문: " + q.zh + "\n" : "") + "내가 말한 내용: " + ta.value.trim();
        var done = function () { var b = t.closest(".sp-copy"); b.textContent = "✅ 복사됨"; setTimeout(function () { b.textContent = "📋 복사"; }, 1500); };
        if (navigator.clipboard) navigator.clipboard.writeText(txt).then(done, function () { ta.select(); });
        else { ta.select(); document.execCommand("copy"); done(); }
      }
    });
  }
  window.addEventListener("resize", function () {
    document.querySelectorAll(".sp-read").forEach(function (r) { var box = r.closest(".sp"); if (box && box._list) draw(box); });
  });
  /* 탭을 떠나거나 다른 과를 열면 녹음·받아쓰기를 멈춤 */
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".wa-tabs, .week-item > summary")) return;
    if (active) stopRec(active);
    document.querySelectorAll(".sp").forEach(function (b) { if (b._talk && b._talk.on) stopTalk(b); });
  }, true);

  var st = document.createElement("style");
  st.textContent =
    ".sp{display:grid;gap:18px}" +
    ".sp-part{padding:16px 18px;border:1px solid var(--line,#e6dccb);border-radius:14px;background:var(--surface,#fff)}" +
    ".sp-part h5{margin:0 0 6px;font-size:16px;color:var(--brown-700,#6b4a2e);display:flex;align-items:center;gap:8px}" +
    ".sp-tag{font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px;background:#eef3f8;color:#4a6584}" +
    ".sp-desc{margin:0 0 10px;font-size:13px;color:var(--text-soft,#7a6a5a)}" +
    ".sp-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:8px 0}" +
    ".sp-pick{max-width:100%;height:34px;padding:0 10px;border:1px solid var(--line,#e6dccb);border-radius:10px;background:var(--surface,#fff);color:inherit;font:inherit;font-size:14px}" +
    ".sp-btn{display:inline-flex;align-items:center;gap:4px;height:34px;padding:0 12px;border:1px solid #bfdfc9;border-radius:10px;background:#e6f4ea;color:#2f6b45;font:inherit;font-size:13px;font-weight:600;cursor:pointer;text-decoration:none}" +
    ".sp-btn:hover{background:#d8eedf}" +
    ".sp-btn:disabled{opacity:.45;cursor:default}" +
    ".sp-btn.is-on{background:#fde8e6;border-color:#f2b8b1;color:#b2362b;animation:spPulse 1.2s infinite}" +
    ".sp-ai{background:#eef3f8;border-color:#c9d8ea;color:#355a85}" +
    "@keyframes spPulse{50%{box-shadow:0 0 0 4px rgba(210,70,58,.15)}}" +
    ".sp-sent{margin:6px 0 4px}" +
    ".sp-zh{font-size:24px;font-weight:600;line-height:1.5}" +
    ".sp-py{font-size:14px;color:#4a6584}" +
    ".sp-ko{font-size:13px;color:var(--text-soft,#7a6a5a)}" +
    ".sp-cvwrap{width:100%;margin-top:6px;border-radius:12px;background:rgba(127,127,127,.04)}" +
    ".sp-cv{display:block}" +
    ".sp-msg,.sp-talk-msg{min-height:1em;margin:6px 0 0;font-size:13px;color:var(--text-soft,#7a6a5a)}" +
    ".sp-help{margin-top:6px;font-size:13px;color:var(--text-soft,#7a6a5a)}" +
    ".sp-help summary{cursor:pointer}" +
    ".sp-help ul{margin:6px 0 0;padding-left:18px}" +
    ".sp-prompts{margin:0 0 6px;padding-left:20px;display:grid;gap:8px}" +
    ".sp-prompts label{cursor:pointer}" +
    ".sp-prompts b{font-size:16px}" +
    ".sp-prompts span{font-size:13px;color:var(--text-soft,#7a6a5a)}" +
    ".sp-hint{font-size:12px;color:#4a6584;margin-left:22px}" +
    ".sp-time{font-size:13px;font-weight:600;color:#b2362b}" +
    ".sp-text{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid var(--line,#e6dccb);border-radius:12px;background:var(--surface,#fff);color:inherit;font-size:17px;line-height:1.6;resize:vertical}" +
    ".sp-count{font-size:12px;color:var(--text-soft,#7a6a5a);margin-right:auto}" +
    ".sp-score{margin-top:8px;padding:12px 14px;border-radius:12px;background:#f3f8f4;border:1px solid #d6eadc}" +
    ".sp-sc-head{font-size:15px;display:flex;align-items:center;gap:8px}" +
    ".sp-stars{color:#e0a21b;font-size:18px;letter-spacing:1px}.sp-stars i{font-style:normal;color:#d9d2c5}" +
    ".sp-sc-cmt{margin:4px 0 0;font-size:14px}" +
    ".sp-sc-tips{margin-top:8px;font-size:13px}.sp-sc-tips ul{margin:4px 0 0;padding-left:18px}" +
    ".sp-sc-note{margin:8px 0 0;font-size:12px;color:var(--text-soft,#7a6a5a)}" +
    ".sp-aibox{margin-top:10px;padding-top:10px;border-top:1px dashed var(--line,#e6dccb)}" +
    ".sp-keyinfo{font-size:13px;color:var(--text-soft,#7a6a5a)}" +
    ".sp-link{border:0;background:none;padding:0;font:inherit;font-size:13px;color:#355a85;text-decoration:underline;cursor:pointer}" +
    ".sp-keybox{margin:6px 0;padding:12px 14px;border:1px solid #c9d8ea;border-radius:12px;background:#f4f8fc}" +
    ".sp-keylab{font-weight:700;font-size:14px}" +
    ".sp-keyin{flex:1;min-width:200px;height:34px;padding:0 10px;border:1px solid var(--line,#e6dccb);border-radius:10px;font:inherit;font-size:14px;background:var(--surface,#fff);color:inherit}" +
    ".sp-keykeep-lab{display:block;font-size:13px;margin:2px 0 6px;cursor:pointer}" +
    ".sp-eval-msg{min-height:1em;margin:6px 0 0;font-size:13px;color:#b2362b}" +
    ".sp-res{margin-top:8px;padding:14px 16px;border-radius:12px;border:1px solid #d6eadc;background:#f8fbf9}" +
    ".sp-res h6{margin:14px 0 6px;font-size:14px}" +
    ".sp-res-lv{font-size:18px;font-weight:700}.sp-res-sum{margin:4px 0 10px;font-size:14px}" +
    ".sp-res-scores{display:grid;gap:8px}" +
    ".sp-rs{display:grid;grid-template-columns:8.5em 1fr 2.6em;gap:2px 10px;align-items:center;font-size:14px}" +
    ".sp-rs-lab{font-weight:600}.sp-rs-bar{height:9px;border-radius:999px;background:#e3e0d8;overflow:hidden}.sp-rs-bar span{display:block;height:100%;background:#2f8a55}" +
    ".sp-rs b{text-align:right}.sp-rs-cmt{grid-column:2/4;font-size:13px;color:var(--text-soft,#7a6a5a)}" +
    ".sp-errs{margin:0;padding:0;list-style:none;display:grid;gap:8px}" +
    ".sp-errs li{border-left:3px solid #d2463a;background:#fdf1ef;padding:8px 12px;border-radius:0 10px 10px 0}" +
    ".sp-err-type{font-size:12px;font-weight:700;color:#b2362b}.sp-err-from{font-size:16px;text-decoration:line-through;text-decoration-color:#d2463a}" +
    ".sp-err-to{font-size:16px;font-weight:700}.sp-err-py{font-size:13px;color:#4a6584}.sp-err-why{font-size:14px}" +
    ".sp-good{margin:0;padding-left:20px;font-size:14px}.sp-better{font-size:17px}" +
    "@media (max-width:520px){.sp-rs{grid-template-columns:1fr 2.6em}.sp-rs-bar{grid-column:1/3;grid-row:2}.sp-rs-cmt{grid-column:1/3}}";
  document.head.appendChild(st);

  window.SPEAKING = {
    has: function (n, c) { return !!ON[String(n)] && sentenceList(c || {}).length > 0; },
    html: html,
    mount: mount,
    stop: function () { if (active) stopRec(active); },
    /* 점검용: 가짜 음높이 프레임으로 그래프 그려 보기 */
    _test: function (box, frames) { box._frames = frames; box._curve = clean(frames); box._seg = segment(box); var r = judge(box); showScore(box, r); draw(box); return r; },
    _detect: detect,
    _tune: function (bw, dw) { BW = bw; DW = dw; },
    _ai: { vendor: vendor, call: callAI, prompt: evalPrompt, render: renderResult },
  };
})();
