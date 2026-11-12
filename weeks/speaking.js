/* 🎙️ 말하기 연습 탭 (시험판: 제1과부터)
   ① 성조 곡선 낭독: 마이크로 문장을 읽으면 목소리의 음높이(성조 곡선)를 그려,
      교과서 성조 모양(5도 표기: 1성 55, 2성 35, 3성 214, 4성 51)과 나란히 보여 줍니다.
      - 서버 없이 브라우저 안에서만 계산하고, 녹음은 어디에도 올리지 않습니다.
      - 음절 위치는 목소리가 난 구간을 글자 수로 나눠 어림한 것이라 '참고용'입니다.
   ② 자유 말하기: 크롬의 음성 인식으로 말한 내용을 글자로 받아 적습니다.
      받아 적은 글은 복사해서 'AI 평가(시험판)' 페이지에 붙여 넣어 평가받을 수 있어요.
   index.html이 SPEAKING.has(n) / SPEAKING.html(n, c) / SPEAKING.mount(el, n, c)를 부릅니다. */
(function () {
  "use strict";

  /* AI 평가 시험판 (claude.ai 아티팩트, 선생님 계정에서 작동) */
  var AI_URL = "https://claude.ai/artifact/KGXEDxW2KsGtk7n2mbqAUG";

  /* 과별 자유 말하기 제시어 */
  var PROMPTS = {
    "101": [
      { zh: "你这个学期选了什么课？选好了吗？", ko: "이번 학기에 무슨 수업을 신청했나요? 다 신청했나요?", hint: "选好、有点儿、一……就……、应该" },
      { zh: "你放假的时候做了什么？去哪儿了？", ko: "방학 때 무엇을 했나요? 어디에 갔나요?", hint: "去过……次、……了……天、雪白雪白的、离……很远" },
      { zh: "说说你这个学期的计划。", ko: "이번 학기 계획을 말해 보세요.", hint: "连……都、打算、应该、一……就……" },
    ],
  };
  var ON = { "101": true };

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
      (AI_URL ? '<a class="sp-btn sp-ai" href="' + esc(AI_URL) + '" target="_blank" rel="noopener">🤖 AI 평가 받기 (시험판)</a>' : "") +
      "</div>" +
      (AI_URL ? '<p class="sp-desc sp-ainote">🤖 AI 평가 시험판은 선생님 claude.ai 계정에서 작동해요. 받아 적은 글을 복사해 붙여 넣으면 어휘·문법·발음(추정)을 평가하고 틀린 곳을 짚어 줘요.</p>' : "") +
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
    ".sp-sc-note{margin:8px 0 0;font-size:12px;color:var(--text-soft,#7a6a5a)}";
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
  };
})();
