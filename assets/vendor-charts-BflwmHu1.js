import { I as gi } from "./vendor-T22VVXAY.js";
function An(t, n) {
  return t == null || n == null
    ? NaN
    : t < n
      ? -1
      : t > n
        ? 1
        : t >= n
          ? 0
          : NaN;
}
function No(t, n) {
  return t == null || n == null
    ? NaN
    : n < t
      ? -1
      : n > t
        ? 1
        : n >= t
          ? 0
          : NaN;
}
function We(t) {
  let n, e, i;
  t.length !== 2
    ? ((n = An), (e = (u, c) => An(t(u), c)), (i = (u, c) => t(u) - c))
    : ((n = t === An || t === No ? t : Co), (e = t), (i = t));
  function r(u, c, a = 0, h = u.length) {
    if (a < h) {
      if (n(c, c) !== 0) return h;
      do {
        const _ = (a + h) >>> 1;
        e(u[_], c) < 0 ? (a = _ + 1) : (h = _);
      } while (a < h);
    }
    return a;
  }
  function o(u, c, a = 0, h = u.length) {
    if (a < h) {
      if (n(c, c) !== 0) return h;
      do {
        const _ = (a + h) >>> 1;
        e(u[_], c) <= 0 ? (a = _ + 1) : (h = _);
      } while (a < h);
    }
    return a;
  }
  function s(u, c, a = 0, h = u.length) {
    const _ = r(u, c, a, h - 1);
    return _ > a && i(u[_ - 1], c) > -i(u[_], c) ? _ - 1 : _;
  }
  return { left: r, center: s, right: o };
}
function Co() {
  return 0;
}
function So(t) {
  return t === null ? NaN : +t;
}
const Ao = We(An),
  $o = Ao.right;
We(So).center;
const Do = Math.sqrt(50),
  Eo = Math.sqrt(10),
  zo = Math.sqrt(2);
function Fn(t, n, e) {
  const i = (n - t) / Math.max(0, e),
    r = Math.floor(Math.log10(i)),
    o = i / Math.pow(10, r),
    s = o >= Do ? 10 : o >= Eo ? 5 : o >= zo ? 2 : 1;
  let u, c, a;
  return (
    r < 0
      ? ((a = Math.pow(10, -r) / s),
        (u = Math.round(t * a)),
        (c = Math.round(n * a)),
        u / a < t && ++u,
        c / a > n && --c,
        (a = -a))
      : ((a = Math.pow(10, r) * s),
        (u = Math.round(t / a)),
        (c = Math.round(n / a)),
        u * a < t && ++u,
        c * a > n && --c),
    c < u && 0.5 <= e && e < 2 ? Fn(t, n, e * 2) : [u, c, a]
  );
}
function Uo(t, n, e) {
  if (((n = +n), (t = +t), (e = +e), !(e > 0))) return [];
  if (t === n) return [t];
  const i = n < t,
    [r, o, s] = i ? Fn(n, t, e) : Fn(t, n, e);
  if (!(o >= r)) return [];
  const u = o - r + 1,
    c = new Array(u);
  if (i)
    if (s < 0) for (let a = 0; a < u; ++a) c[a] = (o - a) / -s;
    else for (let a = 0; a < u; ++a) c[a] = (o - a) * s;
  else if (s < 0) for (let a = 0; a < u; ++a) c[a] = (r + a) / -s;
  else for (let a = 0; a < u; ++a) c[a] = (r + a) * s;
  return c;
}
function Ae(t, n, e) {
  return ((n = +n), (t = +t), (e = +e), Fn(t, n, e)[2]);
}
function $e(t, n, e) {
  ((n = +n), (t = +t), (e = +e));
  const i = n < t,
    r = i ? Ae(n, t, e) : Ae(t, n, e);
  return (i ? -1 : 1) * (r < 0 ? 1 / -r : r);
}
function Zf(t, n) {
  let e;
  if (n === void 0)
    for (const i of t)
      i != null && (e < i || (e === void 0 && i >= i)) && (e = i);
  else {
    let i = -1;
    for (let r of t)
      (r = n(r, ++i, t)) != null &&
        (e < r || (e === void 0 && r >= r)) &&
        (e = r);
  }
  return e;
}
function Qf(t, n) {
  let e;
  if (n === void 0)
    for (const i of t)
      i != null && (e > i || (e === void 0 && i >= i)) && (e = i);
  else {
    let i = -1;
    for (let r of t)
      (r = n(r, ++i, t)) != null &&
        (e > r || (e === void 0 && r >= r)) &&
        (e = r);
  }
  return e;
}
function Lo(t, n, e) {
  ((t = +t),
    (n = +n),
    (e = (r = arguments.length) < 2 ? ((n = t), (t = 0), 1) : r < 3 ? 1 : +e));
  for (
    var i = -1, r = Math.max(0, Math.ceil((n - t) / e)) | 0, o = new Array(r);
    ++i < r;

  )
    o[i] = t + i * e;
  return o;
}
function Fo(t) {
  return t;
}
var $n = 1,
  le = 2,
  De = 3,
  vn = 4,
  pi = 1e-6;
function Ro(t) {
  return "translate(" + t + ",0)";
}
function Po(t) {
  return "translate(0," + t + ")";
}
function Io(t) {
  return n => +t(n);
}
function Yo(t, n) {
  return (
    (n = Math.max(0, t.bandwidth() - n * 2) / 2),
    t.round() && (n = Math.round(n)),
    e => +t(e) + n
  );
}
function Ho() {
  return !this.__axis;
}
function fr(t, n) {
  var e = [],
    i = null,
    r = null,
    o = 6,
    s = 6,
    u = 3,
    c = typeof window < "u" && window.devicePixelRatio > 1 ? 0 : 0.5,
    a = t === $n || t === vn ? -1 : 1,
    h = t === vn || t === le ? "x" : "y",
    _ = t === $n || t === De ? Ro : Po;
  function l(f) {
    var m = i ?? (n.ticks ? n.ticks.apply(n, e) : n.domain()),
      v = r ?? (n.tickFormat ? n.tickFormat.apply(n, e) : Fo),
      y = Math.max(o, 0) + u,
      g = n.range(),
      k = +g[0] + c,
      C = +g[g.length - 1] + c,
      p = (n.bandwidth ? Yo : Io)(n.copy(), c),
      S = f.selection ? f.selection() : f,
      T = S.selectAll(".domain").data([null]),
      z = S.selectAll(".tick").data(m, n).order(),
      L = z.exit(),
      I = z.enter().append("g").attr("class", "tick"),
      R = z.select("line"),
      D = z.select("text");
    ((T = T.merge(
      T.enter()
        .insert("path", ".tick")
        .attr("class", "domain")
        .attr("stroke", "currentColor")
    )),
      (z = z.merge(I)),
      (R = R.merge(
        I.append("line")
          .attr("stroke", "currentColor")
          .attr(h + "2", a * o)
      )),
      (D = D.merge(
        I.append("text")
          .attr("fill", "currentColor")
          .attr(h, a * y)
          .attr("dy", t === $n ? "0em" : t === De ? "0.71em" : "0.32em")
      )),
      f !== S &&
        ((T = T.transition(f)),
        (z = z.transition(f)),
        (R = R.transition(f)),
        (D = D.transition(f)),
        (L = L.transition(f)
          .attr("opacity", pi)
          .attr("transform", function (P) {
            return isFinite((P = p(P)))
              ? _(P + c)
              : this.getAttribute("transform");
          })),
        I.attr("opacity", pi).attr("transform", function (P) {
          var E = this.parentNode.__axis;
          return _((E && isFinite((E = E(P))) ? E : p(P)) + c);
        })),
      L.remove(),
      T.attr(
        "d",
        t === vn || t === le
          ? s
            ? "M" + a * s + "," + k + "H" + c + "V" + C + "H" + a * s
            : "M" + c + "," + k + "V" + C
          : s
            ? "M" + k + "," + a * s + "V" + c + "H" + C + "V" + a * s
            : "M" + k + "," + c + "H" + C
      ),
      z.attr("opacity", 1).attr("transform", function (P) {
        return _(p(P) + c);
      }),
      R.attr(h + "2", a * o),
      D.attr(h, a * y).text(v),
      S.filter(Ho)
        .attr("fill", "none")
        .attr("font-size", 10)
        .attr("font-family", "sans-serif")
        .attr("text-anchor", t === le ? "start" : t === vn ? "end" : "middle"),
      S.each(function () {
        this.__axis = p;
      }));
  }
  return (
    (l.scale = function (f) {
      return arguments.length ? ((n = f), l) : n;
    }),
    (l.ticks = function () {
      return ((e = Array.from(arguments)), l);
    }),
    (l.tickArguments = function (f) {
      return arguments.length
        ? ((e = f == null ? [] : Array.from(f)), l)
        : e.slice();
    }),
    (l.tickValues = function (f) {
      return arguments.length
        ? ((i = f == null ? null : Array.from(f)), l)
        : i && i.slice();
    }),
    (l.tickFormat = function (f) {
      return arguments.length ? ((r = f), l) : r;
    }),
    (l.tickSize = function (f) {
      return arguments.length ? ((o = s = +f), l) : o;
    }),
    (l.tickSizeInner = function (f) {
      return arguments.length ? ((o = +f), l) : o;
    }),
    (l.tickSizeOuter = function (f) {
      return arguments.length ? ((s = +f), l) : s;
    }),
    (l.tickPadding = function (f) {
      return arguments.length ? ((u = +f), l) : u;
    }),
    (l.offset = function (f) {
      return arguments.length ? ((c = +f), l) : c;
    }),
    l
  );
}
function Gf(t) {
  return fr($n, t);
}
function Kf(t) {
  return fr(De, t);
}
var Oo = { value: () => {} };
function dn() {
  for (var t = 0, n = arguments.length, e = {}, i; t < n; ++t) {
    if (!(i = arguments[t] + "") || i in e || /[\s.]/.test(i))
      throw new Error("illegal type: " + i);
    e[i] = [];
  }
  return new Dn(e);
}
function Dn(t) {
  this._ = t;
}
function Bo(t, n) {
  return t
    .trim()
    .split(/^|\s+/)
    .map(function (e) {
      var i = "",
        r = e.indexOf(".");
      if (
        (r >= 0 && ((i = e.slice(r + 1)), (e = e.slice(0, r))),
        e && !n.hasOwnProperty(e))
      )
        throw new Error("unknown type: " + e);
      return { type: e, name: i };
    });
}
Dn.prototype = dn.prototype = {
  constructor: Dn,
  on: function (t, n) {
    var e = this._,
      i = Bo(t + "", e),
      r,
      o = -1,
      s = i.length;
    if (arguments.length < 2) {
      for (; ++o < s; )
        if ((r = (t = i[o]).type) && (r = qo(e[r], t.name))) return r;
      return;
    }
    if (n != null && typeof n != "function")
      throw new Error("invalid callback: " + n);
    for (; ++o < s; )
      if ((r = (t = i[o]).type)) e[r] = di(e[r], t.name, n);
      else if (n == null) for (r in e) e[r] = di(e[r], t.name, null);
    return this;
  },
  copy: function () {
    var t = {},
      n = this._;
    for (var e in n) t[e] = n[e].slice();
    return new Dn(t);
  },
  call: function (t, n) {
    if ((r = arguments.length - 2) > 0)
      for (var e = new Array(r), i = 0, r, o; i < r; ++i)
        e[i] = arguments[i + 2];
    if (!this._.hasOwnProperty(t)) throw new Error("unknown type: " + t);
    for (o = this._[t], i = 0, r = o.length; i < r; ++i) o[i].value.apply(n, e);
  },
  apply: function (t, n, e) {
    if (!this._.hasOwnProperty(t)) throw new Error("unknown type: " + t);
    for (var i = this._[t], r = 0, o = i.length; r < o; ++r)
      i[r].value.apply(n, e);
  },
};
function qo(t, n) {
  for (var e = 0, i = t.length, r; e < i; ++e)
    if ((r = t[e]).name === n) return r.value;
}
function di(t, n, e) {
  for (var i = 0, r = t.length; i < r; ++i)
    if (t[i].name === n) {
      ((t[i] = Oo), (t = t.slice(0, i).concat(t.slice(i + 1))));
      break;
    }
  return (e != null && t.push({ name: n, value: e }), t);
}
var Ee = "http://www.w3.org/1999/xhtml";
const mi = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: Ee,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/",
};
function ee(t) {
  var n = (t += ""),
    e = n.indexOf(":");
  return (
    e >= 0 && (n = t.slice(0, e)) !== "xmlns" && (t = t.slice(e + 1)),
    mi.hasOwnProperty(n) ? { space: mi[n], local: t } : t
  );
}
function Vo(t) {
  return function () {
    var n = this.ownerDocument,
      e = this.namespaceURI;
    return e === Ee && n.documentElement.namespaceURI === Ee
      ? n.createElement(t)
      : n.createElementNS(e, t);
  };
}
function Xo(t) {
  return function () {
    return this.ownerDocument.createElementNS(t.space, t.local);
  };
}
function _r(t) {
  var n = ee(t);
  return (n.local ? Xo : Vo)(n);
}
function Wo() {}
function Ze(t) {
  return t == null
    ? Wo
    : function () {
        return this.querySelector(t);
      };
}
function Zo(t) {
  typeof t != "function" && (t = Ze(t));
  for (var n = this._groups, e = n.length, i = new Array(e), r = 0; r < e; ++r)
    for (
      var o = n[r], s = o.length, u = (i[r] = new Array(s)), c, a, h = 0;
      h < s;
      ++h
    )
      (c = o[h]) &&
        (a = t.call(c, c.__data__, h, o)) &&
        ("__data__" in c && (a.__data__ = c.__data__), (u[h] = a));
  return new at(i, this._parents);
}
function Qo(t) {
  return t == null ? [] : Array.isArray(t) ? t : Array.from(t);
}
function Go() {
  return [];
}
function gr(t) {
  return t == null
    ? Go
    : function () {
        return this.querySelectorAll(t);
      };
}
function Ko(t) {
  return function () {
    return Qo(t.apply(this, arguments));
  };
}
function Jo(t) {
  typeof t == "function" ? (t = Ko(t)) : (t = gr(t));
  for (var n = this._groups, e = n.length, i = [], r = [], o = 0; o < e; ++o)
    for (var s = n[o], u = s.length, c, a = 0; a < u; ++a)
      (c = s[a]) && (i.push(t.call(c, c.__data__, a, s)), r.push(c));
  return new at(i, r);
}
function pr(t) {
  return function () {
    return this.matches(t);
  };
}
function dr(t) {
  return function (n) {
    return n.matches(t);
  };
}
var jo = Array.prototype.find;
function ts(t) {
  return function () {
    return jo.call(this.children, t);
  };
}
function ns() {
  return this.firstElementChild;
}
function es(t) {
  return this.select(t == null ? ns : ts(typeof t == "function" ? t : dr(t)));
}
var is = Array.prototype.filter;
function rs() {
  return Array.from(this.children);
}
function os(t) {
  return function () {
    return is.call(this.children, t);
  };
}
function ss(t) {
  return this.selectAll(
    t == null ? rs : os(typeof t == "function" ? t : dr(t))
  );
}
function us(t) {
  typeof t != "function" && (t = pr(t));
  for (var n = this._groups, e = n.length, i = new Array(e), r = 0; r < e; ++r)
    for (var o = n[r], s = o.length, u = (i[r] = []), c, a = 0; a < s; ++a)
      (c = o[a]) && t.call(c, c.__data__, a, o) && u.push(c);
  return new at(i, this._parents);
}
function mr(t) {
  return new Array(t.length);
}
function as() {
  return new at(this._enter || this._groups.map(mr), this._parents);
}
function Rn(t, n) {
  ((this.ownerDocument = t.ownerDocument),
    (this.namespaceURI = t.namespaceURI),
    (this._next = null),
    (this._parent = t),
    (this.__data__ = n));
}
Rn.prototype = {
  constructor: Rn,
  appendChild: function (t) {
    return this._parent.insertBefore(t, this._next);
  },
  insertBefore: function (t, n) {
    return this._parent.insertBefore(t, n);
  },
  querySelector: function (t) {
    return this._parent.querySelector(t);
  },
  querySelectorAll: function (t) {
    return this._parent.querySelectorAll(t);
  },
};
function cs(t) {
  return function () {
    return t;
  };
}
function hs(t, n, e, i, r, o) {
  for (var s = 0, u, c = n.length, a = o.length; s < a; ++s)
    (u = n[s]) ? ((u.__data__ = o[s]), (i[s] = u)) : (e[s] = new Rn(t, o[s]));
  for (; s < c; ++s) (u = n[s]) && (r[s] = u);
}
function ls(t, n, e, i, r, o, s) {
  var u,
    c,
    a = new Map(),
    h = n.length,
    _ = o.length,
    l = new Array(h),
    f;
  for (u = 0; u < h; ++u)
    (c = n[u]) &&
      ((l[u] = f = s.call(c, c.__data__, u, n) + ""),
      a.has(f) ? (r[u] = c) : a.set(f, c));
  for (u = 0; u < _; ++u)
    ((f = s.call(t, o[u], u, o) + ""),
      (c = a.get(f))
        ? ((i[u] = c), (c.__data__ = o[u]), a.delete(f))
        : (e[u] = new Rn(t, o[u])));
  for (u = 0; u < h; ++u) (c = n[u]) && a.get(l[u]) === c && (r[u] = c);
}
function fs(t) {
  return t.__data__;
}
function _s(t, n) {
  if (!arguments.length) return Array.from(this, fs);
  var e = n ? ls : hs,
    i = this._parents,
    r = this._groups;
  typeof t != "function" && (t = cs(t));
  for (
    var o = r.length,
      s = new Array(o),
      u = new Array(o),
      c = new Array(o),
      a = 0;
    a < o;
    ++a
  ) {
    var h = i[a],
      _ = r[a],
      l = _.length,
      f = gs(t.call(h, h && h.__data__, a, i)),
      m = f.length,
      v = (u[a] = new Array(m)),
      y = (s[a] = new Array(m)),
      g = (c[a] = new Array(l));
    e(h, _, v, y, g, f, n);
    for (var k = 0, C = 0, p, S; k < m; ++k)
      if ((p = v[k])) {
        for (k >= C && (C = k + 1); !(S = y[C]) && ++C < m; );
        p._next = S || null;
      }
  }
  return ((s = new at(s, i)), (s._enter = u), (s._exit = c), s);
}
function gs(t) {
  return typeof t == "object" && "length" in t ? t : Array.from(t);
}
function ps() {
  return new at(this._exit || this._groups.map(mr), this._parents);
}
function ds(t, n, e) {
  var i = this.enter(),
    r = this,
    o = this.exit();
  return (
    typeof t == "function"
      ? ((i = t(i)), i && (i = i.selection()))
      : (i = i.append(t + "")),
    n != null && ((r = n(r)), r && (r = r.selection())),
    e == null ? o.remove() : e(o),
    i && r ? i.merge(r).order() : r
  );
}
function ms(t) {
  for (
    var n = t.selection ? t.selection() : t,
      e = this._groups,
      i = n._groups,
      r = e.length,
      o = i.length,
      s = Math.min(r, o),
      u = new Array(r),
      c = 0;
    c < s;
    ++c
  )
    for (
      var a = e[c], h = i[c], _ = a.length, l = (u[c] = new Array(_)), f, m = 0;
      m < _;
      ++m
    )
      (f = a[m] || h[m]) && (l[m] = f);
  for (; c < r; ++c) u[c] = e[c];
  return new at(u, this._parents);
}
function ys() {
  for (var t = this._groups, n = -1, e = t.length; ++n < e; )
    for (var i = t[n], r = i.length - 1, o = i[r], s; --r >= 0; )
      (s = i[r]) &&
        (o &&
          s.compareDocumentPosition(o) ^ 4 &&
          o.parentNode.insertBefore(s, o),
        (o = s));
  return this;
}
function xs(t) {
  t || (t = vs);
  function n(_, l) {
    return _ && l ? t(_.__data__, l.__data__) : !_ - !l;
  }
  for (
    var e = this._groups, i = e.length, r = new Array(i), o = 0;
    o < i;
    ++o
  ) {
    for (
      var s = e[o], u = s.length, c = (r[o] = new Array(u)), a, h = 0;
      h < u;
      ++h
    )
      (a = s[h]) && (c[h] = a);
    c.sort(n);
  }
  return new at(r, this._parents).order();
}
function vs(t, n) {
  return t < n ? -1 : t > n ? 1 : t >= n ? 0 : NaN;
}
function ws() {
  var t = arguments[0];
  return ((arguments[0] = this), t.apply(null, arguments), this);
}
function Ms() {
  return Array.from(this);
}
function bs() {
  for (var t = this._groups, n = 0, e = t.length; n < e; ++n)
    for (var i = t[n], r = 0, o = i.length; r < o; ++r) {
      var s = i[r];
      if (s) return s;
    }
  return null;
}
function Ts() {
  let t = 0;
  for (const n of this) ++t;
  return t;
}
function ks() {
  return !this.node();
}
function Ns(t) {
  for (var n = this._groups, e = 0, i = n.length; e < i; ++e)
    for (var r = n[e], o = 0, s = r.length, u; o < s; ++o)
      (u = r[o]) && t.call(u, u.__data__, o, r);
  return this;
}
function Cs(t) {
  return function () {
    this.removeAttribute(t);
  };
}
function Ss(t) {
  return function () {
    this.removeAttributeNS(t.space, t.local);
  };
}
function As(t, n) {
  return function () {
    this.setAttribute(t, n);
  };
}
function $s(t, n) {
  return function () {
    this.setAttributeNS(t.space, t.local, n);
  };
}
function Ds(t, n) {
  return function () {
    var e = n.apply(this, arguments);
    e == null ? this.removeAttribute(t) : this.setAttribute(t, e);
  };
}
function Es(t, n) {
  return function () {
    var e = n.apply(this, arguments);
    e == null
      ? this.removeAttributeNS(t.space, t.local)
      : this.setAttributeNS(t.space, t.local, e);
  };
}
function zs(t, n) {
  var e = ee(t);
  if (arguments.length < 2) {
    var i = this.node();
    return e.local ? i.getAttributeNS(e.space, e.local) : i.getAttribute(e);
  }
  return this.each(
    (n == null
      ? e.local
        ? Ss
        : Cs
      : typeof n == "function"
        ? e.local
          ? Es
          : Ds
        : e.local
          ? $s
          : As)(e, n)
  );
}
function yr(t) {
  return (
    (t.ownerDocument && t.ownerDocument.defaultView) ||
    (t.document && t) ||
    t.defaultView
  );
}
function Us(t) {
  return function () {
    this.style.removeProperty(t);
  };
}
function Ls(t, n, e) {
  return function () {
    this.style.setProperty(t, n, e);
  };
}
function Fs(t, n, e) {
  return function () {
    var i = n.apply(this, arguments);
    i == null ? this.style.removeProperty(t) : this.style.setProperty(t, i, e);
  };
}
function Rs(t, n, e) {
  return arguments.length > 1
    ? this.each(
        (n == null ? Us : typeof n == "function" ? Fs : Ls)(t, n, e ?? "")
      )
    : Qt(this.node(), t);
}
function Qt(t, n) {
  return (
    t.style.getPropertyValue(n) ||
    yr(t).getComputedStyle(t, null).getPropertyValue(n)
  );
}
function Ps(t) {
  return function () {
    delete this[t];
  };
}
function Is(t, n) {
  return function () {
    this[t] = n;
  };
}
function Ys(t, n) {
  return function () {
    var e = n.apply(this, arguments);
    e == null ? delete this[t] : (this[t] = e);
  };
}
function Hs(t, n) {
  return arguments.length > 1
    ? this.each((n == null ? Ps : typeof n == "function" ? Ys : Is)(t, n))
    : this.node()[t];
}
function xr(t) {
  return t.trim().split(/^|\s+/);
}
function Qe(t) {
  return t.classList || new vr(t);
}
function vr(t) {
  ((this._node = t), (this._names = xr(t.getAttribute("class") || "")));
}
vr.prototype = {
  add: function (t) {
    var n = this._names.indexOf(t);
    n < 0 &&
      (this._names.push(t),
      this._node.setAttribute("class", this._names.join(" ")));
  },
  remove: function (t) {
    var n = this._names.indexOf(t);
    n >= 0 &&
      (this._names.splice(n, 1),
      this._node.setAttribute("class", this._names.join(" ")));
  },
  contains: function (t) {
    return this._names.indexOf(t) >= 0;
  },
};
function wr(t, n) {
  for (var e = Qe(t), i = -1, r = n.length; ++i < r; ) e.add(n[i]);
}
function Mr(t, n) {
  for (var e = Qe(t), i = -1, r = n.length; ++i < r; ) e.remove(n[i]);
}
function Os(t) {
  return function () {
    wr(this, t);
  };
}
function Bs(t) {
  return function () {
    Mr(this, t);
  };
}
function qs(t, n) {
  return function () {
    (n.apply(this, arguments) ? wr : Mr)(this, t);
  };
}
function Vs(t, n) {
  var e = xr(t + "");
  if (arguments.length < 2) {
    for (var i = Qe(this.node()), r = -1, o = e.length; ++r < o; )
      if (!i.contains(e[r])) return !1;
    return !0;
  }
  return this.each((typeof n == "function" ? qs : n ? Os : Bs)(e, n));
}
function Xs() {
  this.textContent = "";
}
function Ws(t) {
  return function () {
    this.textContent = t;
  };
}
function Zs(t) {
  return function () {
    var n = t.apply(this, arguments);
    this.textContent = n ?? "";
  };
}
function Qs(t) {
  return arguments.length
    ? this.each(t == null ? Xs : (typeof t == "function" ? Zs : Ws)(t))
    : this.node().textContent;
}
function Gs() {
  this.innerHTML = "";
}
function Ks(t) {
  return function () {
    this.innerHTML = t;
  };
}
function Js(t) {
  return function () {
    var n = t.apply(this, arguments);
    this.innerHTML = n ?? "";
  };
}
function js(t) {
  return arguments.length
    ? this.each(t == null ? Gs : (typeof t == "function" ? Js : Ks)(t))
    : this.node().innerHTML;
}
function tu() {
  this.nextSibling && this.parentNode.appendChild(this);
}
function nu() {
  return this.each(tu);
}
function eu() {
  this.previousSibling &&
    this.parentNode.insertBefore(this, this.parentNode.firstChild);
}
function iu() {
  return this.each(eu);
}
function ru(t) {
  var n = typeof t == "function" ? t : _r(t);
  return this.select(function () {
    return this.appendChild(n.apply(this, arguments));
  });
}
function ou() {
  return null;
}
function su(t, n) {
  var e = typeof t == "function" ? t : _r(t),
    i = n == null ? ou : typeof n == "function" ? n : Ze(n);
  return this.select(function () {
    return this.insertBefore(
      e.apply(this, arguments),
      i.apply(this, arguments) || null
    );
  });
}
function uu() {
  var t = this.parentNode;
  t && t.removeChild(this);
}
function au() {
  return this.each(uu);
}
function cu() {
  var t = this.cloneNode(!1),
    n = this.parentNode;
  return n ? n.insertBefore(t, this.nextSibling) : t;
}
function hu() {
  var t = this.cloneNode(!0),
    n = this.parentNode;
  return n ? n.insertBefore(t, this.nextSibling) : t;
}
function lu(t) {
  return this.select(t ? hu : cu);
}
function fu(t) {
  return arguments.length ? this.property("__data__", t) : this.node().__data__;
}
function _u(t) {
  return function (n) {
    t.call(this, n, this.__data__);
  };
}
function gu(t) {
  return t
    .trim()
    .split(/^|\s+/)
    .map(function (n) {
      var e = "",
        i = n.indexOf(".");
      return (
        i >= 0 && ((e = n.slice(i + 1)), (n = n.slice(0, i))),
        { type: n, name: e }
      );
    });
}
function pu(t) {
  return function () {
    var n = this.__on;
    if (n) {
      for (var e = 0, i = -1, r = n.length, o; e < r; ++e)
        ((o = n[e]),
          (!t.type || o.type === t.type) && o.name === t.name
            ? this.removeEventListener(o.type, o.listener, o.options)
            : (n[++i] = o));
      ++i ? (n.length = i) : delete this.__on;
    }
  };
}
function du(t, n, e) {
  return function () {
    var i = this.__on,
      r,
      o = _u(n);
    if (i) {
      for (var s = 0, u = i.length; s < u; ++s)
        if ((r = i[s]).type === t.type && r.name === t.name) {
          (this.removeEventListener(r.type, r.listener, r.options),
            this.addEventListener(r.type, (r.listener = o), (r.options = e)),
            (r.value = n));
          return;
        }
    }
    (this.addEventListener(t.type, o, e),
      (r = { type: t.type, name: t.name, value: n, listener: o, options: e }),
      i ? i.push(r) : (this.__on = [r]));
  };
}
function mu(t, n, e) {
  var i = gu(t + ""),
    r,
    o = i.length,
    s;
  if (arguments.length < 2) {
    var u = this.node().__on;
    if (u) {
      for (var c = 0, a = u.length, h; c < a; ++c)
        for (r = 0, h = u[c]; r < o; ++r)
          if ((s = i[r]).type === h.type && s.name === h.name) return h.value;
    }
    return;
  }
  for (u = n ? du : pu, r = 0; r < o; ++r) this.each(u(i[r], n, e));
  return this;
}
function br(t, n, e) {
  var i = yr(t),
    r = i.CustomEvent;
  (typeof r == "function"
    ? (r = new r(n, e))
    : ((r = i.document.createEvent("Event")),
      e
        ? (r.initEvent(n, e.bubbles, e.cancelable), (r.detail = e.detail))
        : r.initEvent(n, !1, !1)),
    t.dispatchEvent(r));
}
function yu(t, n) {
  return function () {
    return br(this, t, n);
  };
}
function xu(t, n) {
  return function () {
    return br(this, t, n.apply(this, arguments));
  };
}
function vu(t, n) {
  return this.each((typeof n == "function" ? xu : yu)(t, n));
}
function* wu() {
  for (var t = this._groups, n = 0, e = t.length; n < e; ++n)
    for (var i = t[n], r = 0, o = i.length, s; r < o; ++r)
      (s = i[r]) && (yield s);
}
var Tr = [null];
function at(t, n) {
  ((this._groups = t), (this._parents = n));
}
function mn() {
  return new at([[document.documentElement]], Tr);
}
function Mu() {
  return this;
}
at.prototype = mn.prototype = {
  constructor: at,
  select: Zo,
  selectAll: Jo,
  selectChild: es,
  selectChildren: ss,
  filter: us,
  data: _s,
  enter: as,
  exit: ps,
  join: ds,
  merge: ms,
  selection: Mu,
  order: ys,
  sort: xs,
  call: ws,
  nodes: Ms,
  node: bs,
  size: Ts,
  empty: ks,
  each: Ns,
  attr: zs,
  style: Rs,
  property: Hs,
  classed: Vs,
  text: Qs,
  html: js,
  raise: nu,
  lower: iu,
  append: ru,
  insert: su,
  remove: au,
  clone: lu,
  datum: fu,
  on: mu,
  dispatch: vu,
  [Symbol.iterator]: wu,
};
function xt(t) {
  return typeof t == "string"
    ? new at([[document.querySelector(t)]], [document.documentElement])
    : new at([[t]], Tr);
}
function bu(t) {
  let n;
  for (; (n = t.sourceEvent); ) t = n;
  return t;
}
function yt(t, n) {
  if (((t = bu(t)), n === void 0 && (n = t.currentTarget), n)) {
    var e = n.ownerSVGElement || n;
    if (e.createSVGPoint) {
      var i = e.createSVGPoint();
      return (
        (i.x = t.clientX),
        (i.y = t.clientY),
        (i = i.matrixTransform(n.getScreenCTM().inverse())),
        [i.x, i.y]
      );
    }
    if (n.getBoundingClientRect) {
      var r = n.getBoundingClientRect();
      return [
        t.clientX - r.left - n.clientLeft,
        t.clientY - r.top - n.clientTop,
      ];
    }
  }
  return [t.pageX, t.pageY];
}
const Tu = { passive: !1 },
  ln = { capture: !0, passive: !1 };
function fe(t) {
  t.stopImmediatePropagation();
}
function Xt(t) {
  (t.preventDefault(), t.stopImmediatePropagation());
}
function kr(t) {
  var n = t.document.documentElement,
    e = xt(t).on("dragstart.drag", Xt, ln);
  "onselectstart" in n
    ? e.on("selectstart.drag", Xt, ln)
    : ((n.__noselect = n.style.MozUserSelect),
      (n.style.MozUserSelect = "none"));
}
function Nr(t, n) {
  var e = t.document.documentElement,
    i = xt(t).on("dragstart.drag", null);
  (n &&
    (i.on("click.drag", Xt, ln),
    setTimeout(function () {
      i.on("click.drag", null);
    }, 0)),
    "onselectstart" in e
      ? i.on("selectstart.drag", null)
      : ((e.style.MozUserSelect = e.__noselect), delete e.__noselect));
}
const wn = t => () => t;
function ze(
  t,
  {
    sourceEvent: n,
    subject: e,
    target: i,
    identifier: r,
    active: o,
    x: s,
    y: u,
    dx: c,
    dy: a,
    dispatch: h,
  }
) {
  Object.defineProperties(this, {
    type: { value: t, enumerable: !0, configurable: !0 },
    sourceEvent: { value: n, enumerable: !0, configurable: !0 },
    subject: { value: e, enumerable: !0, configurable: !0 },
    target: { value: i, enumerable: !0, configurable: !0 },
    identifier: { value: r, enumerable: !0, configurable: !0 },
    active: { value: o, enumerable: !0, configurable: !0 },
    x: { value: s, enumerable: !0, configurable: !0 },
    y: { value: u, enumerable: !0, configurable: !0 },
    dx: { value: c, enumerable: !0, configurable: !0 },
    dy: { value: a, enumerable: !0, configurable: !0 },
    _: { value: h },
  });
}
ze.prototype.on = function () {
  var t = this._.on.apply(this._, arguments);
  return t === this._ ? this : t;
};
function ku(t) {
  return !t.ctrlKey && !t.button;
}
function Nu() {
  return this.parentNode;
}
function Cu(t, n) {
  return n ?? { x: t.x, y: t.y };
}
function Su() {
  return navigator.maxTouchPoints || "ontouchstart" in this;
}
function Jf() {
  var t = ku,
    n = Nu,
    e = Cu,
    i = Su,
    r = {},
    o = dn("start", "drag", "end"),
    s = 0,
    u,
    c,
    a,
    h,
    _ = 0;
  function l(p) {
    p.on("mousedown.drag", f)
      .filter(i)
      .on("touchstart.drag", y)
      .on("touchmove.drag", g, Tu)
      .on("touchend.drag touchcancel.drag", k)
      .style("touch-action", "none")
      .style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
  }
  function f(p, S) {
    if (!(h || !t.call(this, p, S))) {
      var T = C(this, n.call(this, p, S), p, S, "mouse");
      T &&
        (xt(p.view).on("mousemove.drag", m, ln).on("mouseup.drag", v, ln),
        kr(p.view),
        fe(p),
        (a = !1),
        (u = p.clientX),
        (c = p.clientY),
        T("start", p));
    }
  }
  function m(p) {
    if ((Xt(p), !a)) {
      var S = p.clientX - u,
        T = p.clientY - c;
      a = S * S + T * T > _;
    }
    r.mouse("drag", p);
  }
  function v(p) {
    (xt(p.view).on("mousemove.drag mouseup.drag", null),
      Nr(p.view, a),
      Xt(p),
      r.mouse("end", p));
  }
  function y(p, S) {
    if (t.call(this, p, S)) {
      var T = p.changedTouches,
        z = n.call(this, p, S),
        L = T.length,
        I,
        R;
      for (I = 0; I < L; ++I)
        (R = C(this, z, p, S, T[I].identifier, T[I])) &&
          (fe(p), R("start", p, T[I]));
    }
  }
  function g(p) {
    var S = p.changedTouches,
      T = S.length,
      z,
      L;
    for (z = 0; z < T; ++z)
      (L = r[S[z].identifier]) && (Xt(p), L("drag", p, S[z]));
  }
  function k(p) {
    var S = p.changedTouches,
      T = S.length,
      z,
      L;
    for (
      h && clearTimeout(h),
        h = setTimeout(function () {
          h = null;
        }, 500),
        z = 0;
      z < T;
      ++z
    )
      (L = r[S[z].identifier]) && (fe(p), L("end", p, S[z]));
  }
  function C(p, S, T, z, L, I) {
    var R = o.copy(),
      D = yt(I || T, S),
      P,
      E,
      d;
    if (
      (d = e.call(
        p,
        new ze("beforestart", {
          sourceEvent: T,
          target: l,
          identifier: L,
          active: s,
          x: D[0],
          y: D[1],
          dx: 0,
          dy: 0,
          dispatch: R,
        }),
        z
      )) != null
    )
      return (
        (P = d.x - D[0] || 0),
        (E = d.y - D[1] || 0),
        function x(w, M, N) {
          var b = D,
            $;
          switch (w) {
            case "start":
              ((r[L] = x), ($ = s++));
              break;
            case "end":
              (delete r[L], --s);
            case "drag":
              ((D = yt(N || M, S)), ($ = s));
              break;
          }
          R.call(
            w,
            p,
            new ze(w, {
              sourceEvent: M,
              subject: d,
              target: l,
              identifier: L,
              active: $,
              x: D[0] + P,
              y: D[1] + E,
              dx: D[0] - b[0],
              dy: D[1] - b[1],
              dispatch: R,
            }),
            z
          );
        }
      );
  }
  return (
    (l.filter = function (p) {
      return arguments.length
        ? ((t = typeof p == "function" ? p : wn(!!p)), l)
        : t;
    }),
    (l.container = function (p) {
      return arguments.length
        ? ((n = typeof p == "function" ? p : wn(p)), l)
        : n;
    }),
    (l.subject = function (p) {
      return arguments.length
        ? ((e = typeof p == "function" ? p : wn(p)), l)
        : e;
    }),
    (l.touchable = function (p) {
      return arguments.length
        ? ((i = typeof p == "function" ? p : wn(!!p)), l)
        : i;
    }),
    (l.on = function () {
      var p = o.on.apply(o, arguments);
      return p === o ? l : p;
    }),
    (l.clickDistance = function (p) {
      return arguments.length ? ((_ = (p = +p) * p), l) : Math.sqrt(_);
    }),
    l
  );
}
function yn(t, n, e) {
  ((t.prototype = n.prototype = e), (e.constructor = t));
}
function ie(t, n) {
  var e = Object.create(t.prototype);
  for (var i in n) e[i] = n[i];
  return e;
}
function It() {}
var fn = 0.7,
  Pn = 1 / fn,
  Wt = "\\s*([+-]?\\d+)\\s*",
  _n = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*",
  gt = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*",
  Au = /^#([0-9a-f]{3,8})$/,
  $u = new RegExp(`^rgb\\(${Wt},${Wt},${Wt}\\)$`),
  Du = new RegExp(`^rgb\\(${gt},${gt},${gt}\\)$`),
  Eu = new RegExp(`^rgba\\(${Wt},${Wt},${Wt},${_n}\\)$`),
  zu = new RegExp(`^rgba\\(${gt},${gt},${gt},${_n}\\)$`),
  Uu = new RegExp(`^hsl\\(${_n},${gt},${gt}\\)$`),
  Lu = new RegExp(`^hsla\\(${_n},${gt},${gt},${_n}\\)$`),
  yi = {
    aliceblue: 15792383,
    antiquewhite: 16444375,
    aqua: 65535,
    aquamarine: 8388564,
    azure: 15794175,
    beige: 16119260,
    bisque: 16770244,
    black: 0,
    blanchedalmond: 16772045,
    blue: 255,
    blueviolet: 9055202,
    brown: 10824234,
    burlywood: 14596231,
    cadetblue: 6266528,
    chartreuse: 8388352,
    chocolate: 13789470,
    coral: 16744272,
    cornflowerblue: 6591981,
    cornsilk: 16775388,
    crimson: 14423100,
    cyan: 65535,
    darkblue: 139,
    darkcyan: 35723,
    darkgoldenrod: 12092939,
    darkgray: 11119017,
    darkgreen: 25600,
    darkgrey: 11119017,
    darkkhaki: 12433259,
    darkmagenta: 9109643,
    darkolivegreen: 5597999,
    darkorange: 16747520,
    darkorchid: 10040012,
    darkred: 9109504,
    darksalmon: 15308410,
    darkseagreen: 9419919,
    darkslateblue: 4734347,
    darkslategray: 3100495,
    darkslategrey: 3100495,
    darkturquoise: 52945,
    darkviolet: 9699539,
    deeppink: 16716947,
    deepskyblue: 49151,
    dimgray: 6908265,
    dimgrey: 6908265,
    dodgerblue: 2003199,
    firebrick: 11674146,
    floralwhite: 16775920,
    forestgreen: 2263842,
    fuchsia: 16711935,
    gainsboro: 14474460,
    ghostwhite: 16316671,
    gold: 16766720,
    goldenrod: 14329120,
    gray: 8421504,
    green: 32768,
    greenyellow: 11403055,
    grey: 8421504,
    honeydew: 15794160,
    hotpink: 16738740,
    indianred: 13458524,
    indigo: 4915330,
    ivory: 16777200,
    khaki: 15787660,
    lavender: 15132410,
    lavenderblush: 16773365,
    lawngreen: 8190976,
    lemonchiffon: 16775885,
    lightblue: 11393254,
    lightcoral: 15761536,
    lightcyan: 14745599,
    lightgoldenrodyellow: 16448210,
    lightgray: 13882323,
    lightgreen: 9498256,
    lightgrey: 13882323,
    lightpink: 16758465,
    lightsalmon: 16752762,
    lightseagreen: 2142890,
    lightskyblue: 8900346,
    lightslategray: 7833753,
    lightslategrey: 7833753,
    lightsteelblue: 11584734,
    lightyellow: 16777184,
    lime: 65280,
    limegreen: 3329330,
    linen: 16445670,
    magenta: 16711935,
    maroon: 8388608,
    mediumaquamarine: 6737322,
    mediumblue: 205,
    mediumorchid: 12211667,
    mediumpurple: 9662683,
    mediumseagreen: 3978097,
    mediumslateblue: 8087790,
    mediumspringgreen: 64154,
    mediumturquoise: 4772300,
    mediumvioletred: 13047173,
    midnightblue: 1644912,
    mintcream: 16121850,
    mistyrose: 16770273,
    moccasin: 16770229,
    navajowhite: 16768685,
    navy: 128,
    oldlace: 16643558,
    olive: 8421376,
    olivedrab: 7048739,
    orange: 16753920,
    orangered: 16729344,
    orchid: 14315734,
    palegoldenrod: 15657130,
    palegreen: 10025880,
    paleturquoise: 11529966,
    palevioletred: 14381203,
    papayawhip: 16773077,
    peachpuff: 16767673,
    peru: 13468991,
    pink: 16761035,
    plum: 14524637,
    powderblue: 11591910,
    purple: 8388736,
    rebeccapurple: 6697881,
    red: 16711680,
    rosybrown: 12357519,
    royalblue: 4286945,
    saddlebrown: 9127187,
    salmon: 16416882,
    sandybrown: 16032864,
    seagreen: 3050327,
    seashell: 16774638,
    sienna: 10506797,
    silver: 12632256,
    skyblue: 8900331,
    slateblue: 6970061,
    slategray: 7372944,
    slategrey: 7372944,
    snow: 16775930,
    springgreen: 65407,
    steelblue: 4620980,
    tan: 13808780,
    teal: 32896,
    thistle: 14204888,
    tomato: 16737095,
    turquoise: 4251856,
    violet: 15631086,
    wheat: 16113331,
    white: 16777215,
    whitesmoke: 16119285,
    yellow: 16776960,
    yellowgreen: 10145074,
  };
yn(It, Ft, {
  copy(t) {
    return Object.assign(new this.constructor(), this, t);
  },
  displayable() {
    return this.rgb().displayable();
  },
  hex: xi,
  formatHex: xi,
  formatHex8: Fu,
  formatHsl: Ru,
  formatRgb: vi,
  toString: vi,
});
function xi() {
  return this.rgb().formatHex();
}
function Fu() {
  return this.rgb().formatHex8();
}
function Ru() {
  return Sr(this).formatHsl();
}
function vi() {
  return this.rgb().formatRgb();
}
function Ft(t) {
  var n, e;
  return (
    (t = (t + "").trim().toLowerCase()),
    (n = Au.exec(t))
      ? ((e = n[1].length),
        (n = parseInt(n[1], 16)),
        e === 6
          ? wi(n)
          : e === 3
            ? new nt(
                ((n >> 8) & 15) | ((n >> 4) & 240),
                ((n >> 4) & 15) | (n & 240),
                ((n & 15) << 4) | (n & 15),
                1
              )
            : e === 8
              ? Mn(
                  (n >> 24) & 255,
                  (n >> 16) & 255,
                  (n >> 8) & 255,
                  (n & 255) / 255
                )
              : e === 4
                ? Mn(
                    ((n >> 12) & 15) | ((n >> 8) & 240),
                    ((n >> 8) & 15) | ((n >> 4) & 240),
                    ((n >> 4) & 15) | (n & 240),
                    (((n & 15) << 4) | (n & 15)) / 255
                  )
                : null)
      : (n = $u.exec(t))
        ? new nt(n[1], n[2], n[3], 1)
        : (n = Du.exec(t))
          ? new nt(
              (n[1] * 255) / 100,
              (n[2] * 255) / 100,
              (n[3] * 255) / 100,
              1
            )
          : (n = Eu.exec(t))
            ? Mn(n[1], n[2], n[3], n[4])
            : (n = zu.exec(t))
              ? Mn(
                  (n[1] * 255) / 100,
                  (n[2] * 255) / 100,
                  (n[3] * 255) / 100,
                  n[4]
                )
              : (n = Uu.exec(t))
                ? Ti(n[1], n[2] / 100, n[3] / 100, 1)
                : (n = Lu.exec(t))
                  ? Ti(n[1], n[2] / 100, n[3] / 100, n[4])
                  : yi.hasOwnProperty(t)
                    ? wi(yi[t])
                    : t === "transparent"
                      ? new nt(NaN, NaN, NaN, 0)
                      : null
  );
}
function wi(t) {
  return new nt((t >> 16) & 255, (t >> 8) & 255, t & 255, 1);
}
function Mn(t, n, e, i) {
  return (i <= 0 && (t = n = e = NaN), new nt(t, n, e, i));
}
function Cr(t) {
  return (
    t instanceof It || (t = Ft(t)),
    t ? ((t = t.rgb()), new nt(t.r, t.g, t.b, t.opacity)) : new nt()
  );
}
function Ue(t, n, e, i) {
  return arguments.length === 1 ? Cr(t) : new nt(t, n, e, i ?? 1);
}
function nt(t, n, e, i) {
  ((this.r = +t), (this.g = +n), (this.b = +e), (this.opacity = +i));
}
yn(
  nt,
  Ue,
  ie(It, {
    brighter(t) {
      return (
        (t = t == null ? Pn : Math.pow(Pn, t)),
        new nt(this.r * t, this.g * t, this.b * t, this.opacity)
      );
    },
    darker(t) {
      return (
        (t = t == null ? fn : Math.pow(fn, t)),
        new nt(this.r * t, this.g * t, this.b * t, this.opacity)
      );
    },
    rgb() {
      return this;
    },
    clamp() {
      return new nt(Ut(this.r), Ut(this.g), Ut(this.b), In(this.opacity));
    },
    displayable() {
      return (
        -0.5 <= this.r &&
        this.r < 255.5 &&
        -0.5 <= this.g &&
        this.g < 255.5 &&
        -0.5 <= this.b &&
        this.b < 255.5 &&
        0 <= this.opacity &&
        this.opacity <= 1
      );
    },
    hex: Mi,
    formatHex: Mi,
    formatHex8: Pu,
    formatRgb: bi,
    toString: bi,
  })
);
function Mi() {
  return `#${zt(this.r)}${zt(this.g)}${zt(this.b)}`;
}
function Pu() {
  return `#${zt(this.r)}${zt(this.g)}${zt(this.b)}${zt((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}
function bi() {
  const t = In(this.opacity);
  return `${t === 1 ? "rgb(" : "rgba("}${Ut(this.r)}, ${Ut(this.g)}, ${Ut(this.b)}${t === 1 ? ")" : `, ${t})`}`;
}
function In(t) {
  return isNaN(t) ? 1 : Math.max(0, Math.min(1, t));
}
function Ut(t) {
  return Math.max(0, Math.min(255, Math.round(t) || 0));
}
function zt(t) {
  return ((t = Ut(t)), (t < 16 ? "0" : "") + t.toString(16));
}
function Ti(t, n, e, i) {
  return (
    i <= 0
      ? (t = n = e = NaN)
      : e <= 0 || e >= 1
        ? (t = n = NaN)
        : n <= 0 && (t = NaN),
    new lt(t, n, e, i)
  );
}
function Sr(t) {
  if (t instanceof lt) return new lt(t.h, t.s, t.l, t.opacity);
  if ((t instanceof It || (t = Ft(t)), !t)) return new lt();
  if (t instanceof lt) return t;
  t = t.rgb();
  var n = t.r / 255,
    e = t.g / 255,
    i = t.b / 255,
    r = Math.min(n, e, i),
    o = Math.max(n, e, i),
    s = NaN,
    u = o - r,
    c = (o + r) / 2;
  return (
    u
      ? (n === o
          ? (s = (e - i) / u + (e < i) * 6)
          : e === o
            ? (s = (i - n) / u + 2)
            : (s = (n - e) / u + 4),
        (u /= c < 0.5 ? o + r : 2 - o - r),
        (s *= 60))
      : (u = c > 0 && c < 1 ? 0 : s),
    new lt(s, u, c, t.opacity)
  );
}
function Iu(t, n, e, i) {
  return arguments.length === 1 ? Sr(t) : new lt(t, n, e, i ?? 1);
}
function lt(t, n, e, i) {
  ((this.h = +t), (this.s = +n), (this.l = +e), (this.opacity = +i));
}
yn(
  lt,
  Iu,
  ie(It, {
    brighter(t) {
      return (
        (t = t == null ? Pn : Math.pow(Pn, t)),
        new lt(this.h, this.s, this.l * t, this.opacity)
      );
    },
    darker(t) {
      return (
        (t = t == null ? fn : Math.pow(fn, t)),
        new lt(this.h, this.s, this.l * t, this.opacity)
      );
    },
    rgb() {
      var t = (this.h % 360) + (this.h < 0) * 360,
        n = isNaN(t) || isNaN(this.s) ? 0 : this.s,
        e = this.l,
        i = e + (e < 0.5 ? e : 1 - e) * n,
        r = 2 * e - i;
      return new nt(
        _e(t >= 240 ? t - 240 : t + 120, r, i),
        _e(t, r, i),
        _e(t < 120 ? t + 240 : t - 120, r, i),
        this.opacity
      );
    },
    clamp() {
      return new lt(ki(this.h), bn(this.s), bn(this.l), In(this.opacity));
    },
    displayable() {
      return (
        ((0 <= this.s && this.s <= 1) || isNaN(this.s)) &&
        0 <= this.l &&
        this.l <= 1 &&
        0 <= this.opacity &&
        this.opacity <= 1
      );
    },
    formatHsl() {
      const t = In(this.opacity);
      return `${t === 1 ? "hsl(" : "hsla("}${ki(this.h)}, ${bn(this.s) * 100}%, ${bn(this.l) * 100}%${t === 1 ? ")" : `, ${t})`}`;
    },
  })
);
function ki(t) {
  return ((t = (t || 0) % 360), t < 0 ? t + 360 : t);
}
function bn(t) {
  return Math.max(0, Math.min(1, t || 0));
}
function _e(t, n, e) {
  return (
    (t < 60
      ? n + ((e - n) * t) / 60
      : t < 180
        ? e
        : t < 240
          ? n + ((e - n) * (240 - t)) / 60
          : n) * 255
  );
}
const Yu = Math.PI / 180,
  Hu = 180 / Math.PI,
  Yn = 18,
  Ar = 0.96422,
  $r = 1,
  Dr = 0.82521,
  Er = 4 / 29,
  Zt = 6 / 29,
  zr = 3 * Zt * Zt,
  Ou = Zt * Zt * Zt;
function Ur(t) {
  if (t instanceof pt) return new pt(t.l, t.a, t.b, t.opacity);
  if (t instanceof vt) return Lr(t);
  t instanceof nt || (t = Cr(t));
  var n = me(t.r),
    e = me(t.g),
    i = me(t.b),
    r = ge((0.2225045 * n + 0.7168786 * e + 0.0606169 * i) / $r),
    o,
    s;
  return (
    n === e && e === i
      ? (o = s = r)
      : ((o = ge((0.4360747 * n + 0.3850649 * e + 0.1430804 * i) / Ar)),
        (s = ge((0.0139322 * n + 0.0971045 * e + 0.7141733 * i) / Dr))),
    new pt(116 * r - 16, 500 * (o - r), 200 * (r - s), t.opacity)
  );
}
function Bu(t, n, e, i) {
  return arguments.length === 1 ? Ur(t) : new pt(t, n, e, i ?? 1);
}
function pt(t, n, e, i) {
  ((this.l = +t), (this.a = +n), (this.b = +e), (this.opacity = +i));
}
yn(
  pt,
  Bu,
  ie(It, {
    brighter(t) {
      return new pt(this.l + Yn * (t ?? 1), this.a, this.b, this.opacity);
    },
    darker(t) {
      return new pt(this.l - Yn * (t ?? 1), this.a, this.b, this.opacity);
    },
    rgb() {
      var t = (this.l + 16) / 116,
        n = isNaN(this.a) ? t : t + this.a / 500,
        e = isNaN(this.b) ? t : t - this.b / 200;
      return (
        (n = Ar * pe(n)),
        (t = $r * pe(t)),
        (e = Dr * pe(e)),
        new nt(
          de(3.1338561 * n - 1.6168667 * t - 0.4906146 * e),
          de(-0.9787684 * n + 1.9161415 * t + 0.033454 * e),
          de(0.0719453 * n - 0.2289914 * t + 1.4052427 * e),
          this.opacity
        )
      );
    },
  })
);
function ge(t) {
  return t > Ou ? Math.pow(t, 1 / 3) : t / zr + Er;
}
function pe(t) {
  return t > Zt ? t * t * t : zr * (t - Er);
}
function de(t) {
  return (
    255 * (t <= 0.0031308 ? 12.92 * t : 1.055 * Math.pow(t, 1 / 2.4) - 0.055)
  );
}
function me(t) {
  return (t /= 255) <= 0.04045 ? t / 12.92 : Math.pow((t + 0.055) / 1.055, 2.4);
}
function qu(t) {
  if (t instanceof vt) return new vt(t.h, t.c, t.l, t.opacity);
  if ((t instanceof pt || (t = Ur(t)), t.a === 0 && t.b === 0))
    return new vt(NaN, 0 < t.l && t.l < 100 ? 0 : NaN, t.l, t.opacity);
  var n = Math.atan2(t.b, t.a) * Hu;
  return new vt(
    n < 0 ? n + 360 : n,
    Math.sqrt(t.a * t.a + t.b * t.b),
    t.l,
    t.opacity
  );
}
function Le(t, n, e, i) {
  return arguments.length === 1 ? qu(t) : new vt(t, n, e, i ?? 1);
}
function vt(t, n, e, i) {
  ((this.h = +t), (this.c = +n), (this.l = +e), (this.opacity = +i));
}
function Lr(t) {
  if (isNaN(t.h)) return new pt(t.l, 0, 0, t.opacity);
  var n = t.h * Yu;
  return new pt(t.l, Math.cos(n) * t.c, Math.sin(n) * t.c, t.opacity);
}
yn(
  vt,
  Le,
  ie(It, {
    brighter(t) {
      return new vt(this.h, this.c, this.l + Yn * (t ?? 1), this.opacity);
    },
    darker(t) {
      return new vt(this.h, this.c, this.l - Yn * (t ?? 1), this.opacity);
    },
    rgb() {
      return Lr(this).rgb();
    },
  })
);
const re = t => () => t;
function Fr(t, n) {
  return function (e) {
    return t + e * n;
  };
}
function Vu(t, n, e) {
  return (
    (t = Math.pow(t, e)),
    (n = Math.pow(n, e) - t),
    (e = 1 / e),
    function (i) {
      return Math.pow(t + i * n, e);
    }
  );
}
function Xu(t, n) {
  var e = n - t;
  return e
    ? Fr(t, e > 180 || e < -180 ? e - 360 * Math.round(e / 360) : e)
    : re(isNaN(t) ? n : t);
}
function Wu(t) {
  return (t = +t) == 1
    ? hn
    : function (n, e) {
        return e - n ? Vu(n, e, t) : re(isNaN(n) ? e : n);
      };
}
function hn(t, n) {
  var e = n - t;
  return e ? Fr(t, e) : re(isNaN(t) ? n : t);
}
const Hn = (function t(n) {
  var e = Wu(n);
  function i(r, o) {
    var s = e((r = Ue(r)).r, (o = Ue(o)).r),
      u = e(r.g, o.g),
      c = e(r.b, o.b),
      a = hn(r.opacity, o.opacity);
    return function (h) {
      return (
        (r.r = s(h)),
        (r.g = u(h)),
        (r.b = c(h)),
        (r.opacity = a(h)),
        r + ""
      );
    };
  }
  return ((i.gamma = t), i);
})(1);
function Zu(t, n) {
  n || (n = []);
  var e = t ? Math.min(n.length, t.length) : 0,
    i = n.slice(),
    r;
  return function (o) {
    for (r = 0; r < e; ++r) i[r] = t[r] * (1 - o) + n[r] * o;
    return i;
  };
}
function Qu(t) {
  return ArrayBuffer.isView(t) && !(t instanceof DataView);
}
function Gu(t, n) {
  var e = n ? n.length : 0,
    i = t ? Math.min(e, t.length) : 0,
    r = new Array(i),
    o = new Array(e),
    s;
  for (s = 0; s < i; ++s) r[s] = Ge(t[s], n[s]);
  for (; s < e; ++s) o[s] = n[s];
  return function (u) {
    for (s = 0; s < i; ++s) o[s] = r[s](u);
    return o;
  };
}
function Ku(t, n) {
  var e = new Date();
  return (
    (t = +t),
    (n = +n),
    function (i) {
      return (e.setTime(t * (1 - i) + n * i), e);
    }
  );
}
function ht(t, n) {
  return (
    (t = +t),
    (n = +n),
    function (e) {
      return t * (1 - e) + n * e;
    }
  );
}
function Ju(t, n) {
  var e = {},
    i = {},
    r;
  ((t === null || typeof t != "object") && (t = {}),
    (n === null || typeof n != "object") && (n = {}));
  for (r in n) r in t ? (e[r] = Ge(t[r], n[r])) : (i[r] = n[r]);
  return function (o) {
    for (r in e) i[r] = e[r](o);
    return i;
  };
}
var Fe = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
  ye = new RegExp(Fe.source, "g");
function ju(t) {
  return function () {
    return t;
  };
}
function ta(t) {
  return function (n) {
    return t(n) + "";
  };
}
function Rr(t, n) {
  var e = (Fe.lastIndex = ye.lastIndex = 0),
    i,
    r,
    o,
    s = -1,
    u = [],
    c = [];
  for (t = t + "", n = n + ""; (i = Fe.exec(t)) && (r = ye.exec(n)); )
    ((o = r.index) > e &&
      ((o = n.slice(e, o)), u[s] ? (u[s] += o) : (u[++s] = o)),
      (i = i[0]) === (r = r[0])
        ? u[s]
          ? (u[s] += r)
          : (u[++s] = r)
        : ((u[++s] = null), c.push({ i: s, x: ht(i, r) })),
      (e = ye.lastIndex));
  return (
    e < n.length && ((o = n.slice(e)), u[s] ? (u[s] += o) : (u[++s] = o)),
    u.length < 2
      ? c[0]
        ? ta(c[0].x)
        : ju(n)
      : ((n = c.length),
        function (a) {
          for (var h = 0, _; h < n; ++h) u[(_ = c[h]).i] = _.x(a);
          return u.join("");
        })
  );
}
function Ge(t, n) {
  var e = typeof n,
    i;
  return n == null || e === "boolean"
    ? re(n)
    : (e === "number"
        ? ht
        : e === "string"
          ? (i = Ft(n))
            ? ((n = i), Hn)
            : Rr
          : n instanceof Ft
            ? Hn
            : n instanceof Date
              ? Ku
              : Qu(n)
                ? Zu
                : Array.isArray(n)
                  ? Gu
                  : (typeof n.valueOf != "function" &&
                        typeof n.toString != "function") ||
                      isNaN(n)
                    ? Ju
                    : ht)(t, n);
}
function na(t, n) {
  return (
    (t = +t),
    (n = +n),
    function (e) {
      return Math.round(t * (1 - e) + n * e);
    }
  );
}
var Ni = 180 / Math.PI,
  Re = {
    translateX: 0,
    translateY: 0,
    rotate: 0,
    skewX: 0,
    scaleX: 1,
    scaleY: 1,
  };
function Pr(t, n, e, i, r, o) {
  var s, u, c;
  return (
    (s = Math.sqrt(t * t + n * n)) && ((t /= s), (n /= s)),
    (c = t * e + n * i) && ((e -= t * c), (i -= n * c)),
    (u = Math.sqrt(e * e + i * i)) && ((e /= u), (i /= u), (c /= u)),
    t * i < n * e && ((t = -t), (n = -n), (c = -c), (s = -s)),
    {
      translateX: r,
      translateY: o,
      rotate: Math.atan2(n, t) * Ni,
      skewX: Math.atan(c) * Ni,
      scaleX: s,
      scaleY: u,
    }
  );
}
var Tn;
function ea(t) {
  const n = new (typeof DOMMatrix == "function" ? DOMMatrix : WebKitCSSMatrix)(
    t + ""
  );
  return n.isIdentity ? Re : Pr(n.a, n.b, n.c, n.d, n.e, n.f);
}
function ia(t) {
  return t == null ||
    (Tn || (Tn = document.createElementNS("http://www.w3.org/2000/svg", "g")),
    Tn.setAttribute("transform", t),
    !(t = Tn.transform.baseVal.consolidate()))
    ? Re
    : ((t = t.matrix), Pr(t.a, t.b, t.c, t.d, t.e, t.f));
}
function Ir(t, n, e, i) {
  function r(a) {
    return a.length ? a.pop() + " " : "";
  }
  function o(a, h, _, l, f, m) {
    if (a !== _ || h !== l) {
      var v = f.push("translate(", null, n, null, e);
      m.push({ i: v - 4, x: ht(a, _) }, { i: v - 2, x: ht(h, l) });
    } else (_ || l) && f.push("translate(" + _ + n + l + e);
  }
  function s(a, h, _, l) {
    a !== h
      ? (a - h > 180 ? (h += 360) : h - a > 180 && (a += 360),
        l.push({ i: _.push(r(_) + "rotate(", null, i) - 2, x: ht(a, h) }))
      : h && _.push(r(_) + "rotate(" + h + i);
  }
  function u(a, h, _, l) {
    a !== h
      ? l.push({ i: _.push(r(_) + "skewX(", null, i) - 2, x: ht(a, h) })
      : h && _.push(r(_) + "skewX(" + h + i);
  }
  function c(a, h, _, l, f, m) {
    if (a !== _ || h !== l) {
      var v = f.push(r(f) + "scale(", null, ",", null, ")");
      m.push({ i: v - 4, x: ht(a, _) }, { i: v - 2, x: ht(h, l) });
    } else (_ !== 1 || l !== 1) && f.push(r(f) + "scale(" + _ + "," + l + ")");
  }
  return function (a, h) {
    var _ = [],
      l = [];
    return (
      (a = t(a)),
      (h = t(h)),
      o(a.translateX, a.translateY, h.translateX, h.translateY, _, l),
      s(a.rotate, h.rotate, _, l),
      u(a.skewX, h.skewX, _, l),
      c(a.scaleX, a.scaleY, h.scaleX, h.scaleY, _, l),
      (a = h = null),
      function (f) {
        for (var m = -1, v = l.length, y; ++m < v; ) _[(y = l[m]).i] = y.x(f);
        return _.join("");
      }
    );
  };
}
var ra = Ir(ea, "px, ", "px)", "deg)"),
  oa = Ir(ia, ", ", ")", ")"),
  sa = 1e-12;
function Ci(t) {
  return ((t = Math.exp(t)) + 1 / t) / 2;
}
function ua(t) {
  return ((t = Math.exp(t)) - 1 / t) / 2;
}
function aa(t) {
  return ((t = Math.exp(2 * t)) - 1) / (t + 1);
}
const ca = (function t(n, e, i) {
  function r(o, s) {
    var u = o[0],
      c = o[1],
      a = o[2],
      h = s[0],
      _ = s[1],
      l = s[2],
      f = h - u,
      m = _ - c,
      v = f * f + m * m,
      y,
      g;
    if (v < sa)
      ((g = Math.log(l / a) / n),
        (y = function (z) {
          return [u + z * f, c + z * m, a * Math.exp(n * z * g)];
        }));
    else {
      var k = Math.sqrt(v),
        C = (l * l - a * a + i * v) / (2 * a * e * k),
        p = (l * l - a * a - i * v) / (2 * l * e * k),
        S = Math.log(Math.sqrt(C * C + 1) - C),
        T = Math.log(Math.sqrt(p * p + 1) - p);
      ((g = (T - S) / n),
        (y = function (z) {
          var L = z * g,
            I = Ci(S),
            R = (a / (e * k)) * (I * aa(n * L + S) - ua(S));
          return [u + R * f, c + R * m, (a * I) / Ci(n * L + S)];
        }));
    }
    return ((y.duration = (g * 1e3 * n) / Math.SQRT2), y);
  }
  return (
    (r.rho = function (o) {
      var s = Math.max(0.001, +o),
        u = s * s,
        c = u * u;
      return t(s, u, c);
    }),
    r
  );
})(Math.SQRT2, 2, 4);
function ha(t) {
  return function (n, e) {
    var i = t((n = Le(n)).h, (e = Le(e)).h),
      r = hn(n.c, e.c),
      o = hn(n.l, e.l),
      s = hn(n.opacity, e.opacity);
    return function (u) {
      return (
        (n.h = i(u)),
        (n.c = r(u)),
        (n.l = o(u)),
        (n.opacity = s(u)),
        n + ""
      );
    };
  };
}
const jf = ha(Xu);
var Gt = 0,
  an = 0,
  tn = 0,
  Yr = 1e3,
  On,
  cn,
  Bn = 0,
  Rt = 0,
  oe = 0,
  gn = typeof performance == "object" && performance.now ? performance : Date,
  Hr =
    typeof window == "object" && window.requestAnimationFrame
      ? window.requestAnimationFrame.bind(window)
      : function (t) {
          setTimeout(t, 17);
        };
function Ke() {
  return Rt || (Hr(la), (Rt = gn.now() + oe));
}
function la() {
  Rt = 0;
}
function qn() {
  this._call = this._time = this._next = null;
}
qn.prototype = Je.prototype = {
  constructor: qn,
  restart: function (t, n, e) {
    if (typeof t != "function")
      throw new TypeError("callback is not a function");
    ((e = (e == null ? Ke() : +e) + (n == null ? 0 : +n)),
      !this._next &&
        cn !== this &&
        (cn ? (cn._next = this) : (On = this), (cn = this)),
      (this._call = t),
      (this._time = e),
      Pe());
  },
  stop: function () {
    this._call && ((this._call = null), (this._time = 1 / 0), Pe());
  },
};
function Je(t, n, e) {
  var i = new qn();
  return (i.restart(t, n, e), i);
}
function fa() {
  (Ke(), ++Gt);
  for (var t = On, n; t; )
    ((n = Rt - t._time) >= 0 && t._call.call(void 0, n), (t = t._next));
  --Gt;
}
function Si() {
  ((Rt = (Bn = gn.now()) + oe), (Gt = an = 0));
  try {
    fa();
  } finally {
    ((Gt = 0), ga(), (Rt = 0));
  }
}
function _a() {
  var t = gn.now(),
    n = t - Bn;
  n > Yr && ((oe -= n), (Bn = t));
}
function ga() {
  for (var t, n = On, e, i = 1 / 0; n; )
    n._call
      ? (i > n._time && (i = n._time), (t = n), (n = n._next))
      : ((e = n._next), (n._next = null), (n = t ? (t._next = e) : (On = e)));
  ((cn = t), Pe(i));
}
function Pe(t) {
  if (!Gt) {
    an && (an = clearTimeout(an));
    var n = t - Rt;
    n > 24
      ? (t < 1 / 0 && (an = setTimeout(Si, t - gn.now() - oe)),
        tn && (tn = clearInterval(tn)))
      : (tn || ((Bn = gn.now()), (tn = setInterval(_a, Yr))), (Gt = 1), Hr(Si));
  }
}
function Ai(t, n, e) {
  var i = new qn();
  return (
    (n = n == null ? 0 : +n),
    i.restart(
      r => {
        (i.stop(), t(r + n));
      },
      n,
      e
    ),
    i
  );
}
var pa = dn("start", "end", "cancel", "interrupt"),
  da = [],
  Or = 0,
  $i = 1,
  Ie = 2,
  En = 3,
  Di = 4,
  Ye = 5,
  zn = 6;
function se(t, n, e, i, r, o) {
  var s = t.__transition;
  if (!s) t.__transition = {};
  else if (e in s) return;
  ma(t, e, {
    name: n,
    index: i,
    group: r,
    on: pa,
    tween: da,
    time: o.time,
    delay: o.delay,
    duration: o.duration,
    ease: o.ease,
    timer: null,
    state: Or,
  });
}
function je(t, n) {
  var e = ft(t, n);
  if (e.state > Or) throw new Error("too late; already scheduled");
  return e;
}
function dt(t, n) {
  var e = ft(t, n);
  if (e.state > En) throw new Error("too late; already running");
  return e;
}
function ft(t, n) {
  var e = t.__transition;
  if (!e || !(e = e[n])) throw new Error("transition not found");
  return e;
}
function ma(t, n, e) {
  var i = t.__transition,
    r;
  ((i[n] = e), (e.timer = Je(o, 0, e.time)));
  function o(a) {
    ((e.state = $i),
      e.timer.restart(s, e.delay, e.time),
      e.delay <= a && s(a - e.delay));
  }
  function s(a) {
    var h, _, l, f;
    if (e.state !== $i) return c();
    for (h in i)
      if (((f = i[h]), f.name === e.name)) {
        if (f.state === En) return Ai(s);
        f.state === Di
          ? ((f.state = zn),
            f.timer.stop(),
            f.on.call("interrupt", t, t.__data__, f.index, f.group),
            delete i[h])
          : +h < n &&
            ((f.state = zn),
            f.timer.stop(),
            f.on.call("cancel", t, t.__data__, f.index, f.group),
            delete i[h]);
      }
    if (
      (Ai(function () {
        e.state === En &&
          ((e.state = Di), e.timer.restart(u, e.delay, e.time), u(a));
      }),
      (e.state = Ie),
      e.on.call("start", t, t.__data__, e.index, e.group),
      e.state === Ie)
    ) {
      for (
        e.state = En, r = new Array((l = e.tween.length)), h = 0, _ = -1;
        h < l;
        ++h
      )
        (f = e.tween[h].value.call(t, t.__data__, e.index, e.group)) &&
          (r[++_] = f);
      r.length = _ + 1;
    }
  }
  function u(a) {
    for (
      var h =
          a < e.duration
            ? e.ease.call(null, a / e.duration)
            : (e.timer.restart(c), (e.state = Ye), 1),
        _ = -1,
        l = r.length;
      ++_ < l;

    )
      r[_].call(t, h);
    e.state === Ye && (e.on.call("end", t, t.__data__, e.index, e.group), c());
  }
  function c() {
    ((e.state = zn), e.timer.stop(), delete i[n]);
    for (var a in i) return;
    delete t.__transition;
  }
}
function Un(t, n) {
  var e = t.__transition,
    i,
    r,
    o = !0,
    s;
  if (e) {
    n = n == null ? null : n + "";
    for (s in e) {
      if ((i = e[s]).name !== n) {
        o = !1;
        continue;
      }
      ((r = i.state > Ie && i.state < Ye),
        (i.state = zn),
        i.timer.stop(),
        i.on.call(r ? "interrupt" : "cancel", t, t.__data__, i.index, i.group),
        delete e[s]);
    }
    o && delete t.__transition;
  }
}
function ya(t) {
  return this.each(function () {
    Un(this, t);
  });
}
function xa(t, n) {
  var e, i;
  return function () {
    var r = dt(this, t),
      o = r.tween;
    if (o !== e) {
      i = e = o;
      for (var s = 0, u = i.length; s < u; ++s)
        if (i[s].name === n) {
          ((i = i.slice()), i.splice(s, 1));
          break;
        }
    }
    r.tween = i;
  };
}
function va(t, n, e) {
  var i, r;
  if (typeof e != "function") throw new Error();
  return function () {
    var o = dt(this, t),
      s = o.tween;
    if (s !== i) {
      r = (i = s).slice();
      for (var u = { name: n, value: e }, c = 0, a = r.length; c < a; ++c)
        if (r[c].name === n) {
          r[c] = u;
          break;
        }
      c === a && r.push(u);
    }
    o.tween = r;
  };
}
function wa(t, n) {
  var e = this._id;
  if (((t += ""), arguments.length < 2)) {
    for (var i = ft(this.node(), e).tween, r = 0, o = i.length, s; r < o; ++r)
      if ((s = i[r]).name === t) return s.value;
    return null;
  }
  return this.each((n == null ? xa : va)(e, t, n));
}
function ti(t, n, e) {
  var i = t._id;
  return (
    t.each(function () {
      var r = dt(this, i);
      (r.value || (r.value = {}))[n] = e.apply(this, arguments);
    }),
    function (r) {
      return ft(r, i).value[n];
    }
  );
}
function Br(t, n) {
  var e;
  return (
    typeof n == "number"
      ? ht
      : n instanceof Ft
        ? Hn
        : (e = Ft(n))
          ? ((n = e), Hn)
          : Rr
  )(t, n);
}
function Ma(t) {
  return function () {
    this.removeAttribute(t);
  };
}
function ba(t) {
  return function () {
    this.removeAttributeNS(t.space, t.local);
  };
}
function Ta(t, n, e) {
  var i,
    r = e + "",
    o;
  return function () {
    var s = this.getAttribute(t);
    return s === r ? null : s === i ? o : (o = n((i = s), e));
  };
}
function ka(t, n, e) {
  var i,
    r = e + "",
    o;
  return function () {
    var s = this.getAttributeNS(t.space, t.local);
    return s === r ? null : s === i ? o : (o = n((i = s), e));
  };
}
function Na(t, n, e) {
  var i, r, o;
  return function () {
    var s,
      u = e(this),
      c;
    return u == null
      ? void this.removeAttribute(t)
      : ((s = this.getAttribute(t)),
        (c = u + ""),
        s === c
          ? null
          : s === i && c === r
            ? o
            : ((r = c), (o = n((i = s), u))));
  };
}
function Ca(t, n, e) {
  var i, r, o;
  return function () {
    var s,
      u = e(this),
      c;
    return u == null
      ? void this.removeAttributeNS(t.space, t.local)
      : ((s = this.getAttributeNS(t.space, t.local)),
        (c = u + ""),
        s === c
          ? null
          : s === i && c === r
            ? o
            : ((r = c), (o = n((i = s), u))));
  };
}
function Sa(t, n) {
  var e = ee(t),
    i = e === "transform" ? oa : Br;
  return this.attrTween(
    t,
    typeof n == "function"
      ? (e.local ? Ca : Na)(e, i, ti(this, "attr." + t, n))
      : n == null
        ? (e.local ? ba : Ma)(e)
        : (e.local ? ka : Ta)(e, i, n)
  );
}
function Aa(t, n) {
  return function (e) {
    this.setAttribute(t, n.call(this, e));
  };
}
function $a(t, n) {
  return function (e) {
    this.setAttributeNS(t.space, t.local, n.call(this, e));
  };
}
function Da(t, n) {
  var e, i;
  function r() {
    var o = n.apply(this, arguments);
    return (o !== i && (e = (i = o) && $a(t, o)), e);
  }
  return ((r._value = n), r);
}
function Ea(t, n) {
  var e, i;
  function r() {
    var o = n.apply(this, arguments);
    return (o !== i && (e = (i = o) && Aa(t, o)), e);
  }
  return ((r._value = n), r);
}
function za(t, n) {
  var e = "attr." + t;
  if (arguments.length < 2) return (e = this.tween(e)) && e._value;
  if (n == null) return this.tween(e, null);
  if (typeof n != "function") throw new Error();
  var i = ee(t);
  return this.tween(e, (i.local ? Da : Ea)(i, n));
}
function Ua(t, n) {
  return function () {
    je(this, t).delay = +n.apply(this, arguments);
  };
}
function La(t, n) {
  return (
    (n = +n),
    function () {
      je(this, t).delay = n;
    }
  );
}
function Fa(t) {
  var n = this._id;
  return arguments.length
    ? this.each((typeof t == "function" ? Ua : La)(n, t))
    : ft(this.node(), n).delay;
}
function Ra(t, n) {
  return function () {
    dt(this, t).duration = +n.apply(this, arguments);
  };
}
function Pa(t, n) {
  return (
    (n = +n),
    function () {
      dt(this, t).duration = n;
    }
  );
}
function Ia(t) {
  var n = this._id;
  return arguments.length
    ? this.each((typeof t == "function" ? Ra : Pa)(n, t))
    : ft(this.node(), n).duration;
}
function Ya(t, n) {
  if (typeof n != "function") throw new Error();
  return function () {
    dt(this, t).ease = n;
  };
}
function Ha(t) {
  var n = this._id;
  return arguments.length ? this.each(Ya(n, t)) : ft(this.node(), n).ease;
}
function Oa(t, n) {
  return function () {
    var e = n.apply(this, arguments);
    if (typeof e != "function") throw new Error();
    dt(this, t).ease = e;
  };
}
function Ba(t) {
  if (typeof t != "function") throw new Error();
  return this.each(Oa(this._id, t));
}
function qa(t) {
  typeof t != "function" && (t = pr(t));
  for (var n = this._groups, e = n.length, i = new Array(e), r = 0; r < e; ++r)
    for (var o = n[r], s = o.length, u = (i[r] = []), c, a = 0; a < s; ++a)
      (c = o[a]) && t.call(c, c.__data__, a, o) && u.push(c);
  return new Tt(i, this._parents, this._name, this._id);
}
function Va(t) {
  if (t._id !== this._id) throw new Error();
  for (
    var n = this._groups,
      e = t._groups,
      i = n.length,
      r = e.length,
      o = Math.min(i, r),
      s = new Array(i),
      u = 0;
    u < o;
    ++u
  )
    for (
      var c = n[u], a = e[u], h = c.length, _ = (s[u] = new Array(h)), l, f = 0;
      f < h;
      ++f
    )
      (l = c[f] || a[f]) && (_[f] = l);
  for (; u < i; ++u) s[u] = n[u];
  return new Tt(s, this._parents, this._name, this._id);
}
function Xa(t) {
  return (t + "")
    .trim()
    .split(/^|\s+/)
    .every(function (n) {
      var e = n.indexOf(".");
      return (e >= 0 && (n = n.slice(0, e)), !n || n === "start");
    });
}
function Wa(t, n, e) {
  var i,
    r,
    o = Xa(n) ? je : dt;
  return function () {
    var s = o(this, t),
      u = s.on;
    (u !== i && (r = (i = u).copy()).on(n, e), (s.on = r));
  };
}
function Za(t, n) {
  var e = this._id;
  return arguments.length < 2
    ? ft(this.node(), e).on.on(t)
    : this.each(Wa(e, t, n));
}
function Qa(t) {
  return function () {
    var n = this.parentNode;
    for (var e in this.__transition) if (+e !== t) return;
    n && n.removeChild(this);
  };
}
function Ga() {
  return this.on("end.remove", Qa(this._id));
}
function Ka(t) {
  var n = this._name,
    e = this._id;
  typeof t != "function" && (t = Ze(t));
  for (var i = this._groups, r = i.length, o = new Array(r), s = 0; s < r; ++s)
    for (
      var u = i[s], c = u.length, a = (o[s] = new Array(c)), h, _, l = 0;
      l < c;
      ++l
    )
      (h = u[l]) &&
        (_ = t.call(h, h.__data__, l, u)) &&
        ("__data__" in h && (_.__data__ = h.__data__),
        (a[l] = _),
        se(a[l], n, e, l, a, ft(h, e)));
  return new Tt(o, this._parents, n, e);
}
function Ja(t) {
  var n = this._name,
    e = this._id;
  typeof t != "function" && (t = gr(t));
  for (var i = this._groups, r = i.length, o = [], s = [], u = 0; u < r; ++u)
    for (var c = i[u], a = c.length, h, _ = 0; _ < a; ++_)
      if ((h = c[_])) {
        for (
          var l = t.call(h, h.__data__, _, c),
            f,
            m = ft(h, e),
            v = 0,
            y = l.length;
          v < y;
          ++v
        )
          (f = l[v]) && se(f, n, e, v, l, m);
        (o.push(l), s.push(h));
      }
  return new Tt(o, s, n, e);
}
var ja = mn.prototype.constructor;
function tc() {
  return new ja(this._groups, this._parents);
}
function nc(t, n) {
  var e, i, r;
  return function () {
    var o = Qt(this, t),
      s = (this.style.removeProperty(t), Qt(this, t));
    return o === s ? null : o === e && s === i ? r : (r = n((e = o), (i = s)));
  };
}
function qr(t) {
  return function () {
    this.style.removeProperty(t);
  };
}
function ec(t, n, e) {
  var i,
    r = e + "",
    o;
  return function () {
    var s = Qt(this, t);
    return s === r ? null : s === i ? o : (o = n((i = s), e));
  };
}
function ic(t, n, e) {
  var i, r, o;
  return function () {
    var s = Qt(this, t),
      u = e(this),
      c = u + "";
    return (
      u == null && (c = u = (this.style.removeProperty(t), Qt(this, t))),
      s === c ? null : s === i && c === r ? o : ((r = c), (o = n((i = s), u)))
    );
  };
}
function rc(t, n) {
  var e,
    i,
    r,
    o = "style." + n,
    s = "end." + o,
    u;
  return function () {
    var c = dt(this, t),
      a = c.on,
      h = c.value[o] == null ? u || (u = qr(n)) : void 0;
    ((a !== e || r !== h) && (i = (e = a).copy()).on(s, (r = h)), (c.on = i));
  };
}
function oc(t, n, e) {
  var i = (t += "") == "transform" ? ra : Br;
  return n == null
    ? this.styleTween(t, nc(t, i)).on("end.style." + t, qr(t))
    : typeof n == "function"
      ? this.styleTween(t, ic(t, i, ti(this, "style." + t, n))).each(
          rc(this._id, t)
        )
      : this.styleTween(t, ec(t, i, n), e).on("end.style." + t, null);
}
function sc(t, n, e) {
  return function (i) {
    this.style.setProperty(t, n.call(this, i), e);
  };
}
function uc(t, n, e) {
  var i, r;
  function o() {
    var s = n.apply(this, arguments);
    return (s !== r && (i = (r = s) && sc(t, s, e)), i);
  }
  return ((o._value = n), o);
}
function ac(t, n, e) {
  var i = "style." + (t += "");
  if (arguments.length < 2) return (i = this.tween(i)) && i._value;
  if (n == null) return this.tween(i, null);
  if (typeof n != "function") throw new Error();
  return this.tween(i, uc(t, n, e ?? ""));
}
function cc(t) {
  return function () {
    this.textContent = t;
  };
}
function hc(t) {
  return function () {
    var n = t(this);
    this.textContent = n ?? "";
  };
}
function lc(t) {
  return this.tween(
    "text",
    typeof t == "function"
      ? hc(ti(this, "text", t))
      : cc(t == null ? "" : t + "")
  );
}
function fc(t) {
  return function (n) {
    this.textContent = t.call(this, n);
  };
}
function _c(t) {
  var n, e;
  function i() {
    var r = t.apply(this, arguments);
    return (r !== e && (n = (e = r) && fc(r)), n);
  }
  return ((i._value = t), i);
}
function gc(t) {
  var n = "text";
  if (arguments.length < 1) return (n = this.tween(n)) && n._value;
  if (t == null) return this.tween(n, null);
  if (typeof t != "function") throw new Error();
  return this.tween(n, _c(t));
}
function pc() {
  for (
    var t = this._name,
      n = this._id,
      e = Vr(),
      i = this._groups,
      r = i.length,
      o = 0;
    o < r;
    ++o
  )
    for (var s = i[o], u = s.length, c, a = 0; a < u; ++a)
      if ((c = s[a])) {
        var h = ft(c, n);
        se(c, t, e, a, s, {
          time: h.time + h.delay + h.duration,
          delay: 0,
          duration: h.duration,
          ease: h.ease,
        });
      }
  return new Tt(i, this._parents, t, e);
}
function dc() {
  var t,
    n,
    e = this,
    i = e._id,
    r = e.size();
  return new Promise(function (o, s) {
    var u = { value: s },
      c = {
        value: function () {
          --r === 0 && o();
        },
      };
    (e.each(function () {
      var a = dt(this, i),
        h = a.on;
      (h !== t &&
        ((n = (t = h).copy()),
        n._.cancel.push(u),
        n._.interrupt.push(u),
        n._.end.push(c)),
        (a.on = n));
    }),
      r === 0 && o());
  });
}
var mc = 0;
function Tt(t, n, e, i) {
  ((this._groups = t), (this._parents = n), (this._name = e), (this._id = i));
}
function Vr() {
  return ++mc;
}
var mt = mn.prototype;
Tt.prototype = {
  constructor: Tt,
  select: Ka,
  selectAll: Ja,
  selectChild: mt.selectChild,
  selectChildren: mt.selectChildren,
  filter: qa,
  merge: Va,
  selection: tc,
  transition: pc,
  call: mt.call,
  nodes: mt.nodes,
  node: mt.node,
  size: mt.size,
  empty: mt.empty,
  each: mt.each,
  on: Za,
  attr: Sa,
  attrTween: za,
  style: oc,
  styleTween: ac,
  text: lc,
  textTween: gc,
  remove: Ga,
  tween: wa,
  delay: Fa,
  duration: Ia,
  ease: Ha,
  easeVarying: Ba,
  end: dc,
  [Symbol.iterator]: mt[Symbol.iterator],
};
function yc(t) {
  return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
}
var xc = { time: null, delay: 0, duration: 250, ease: yc };
function vc(t, n) {
  for (var e; !(e = t.__transition) || !(e = e[n]); )
    if (!(t = t.parentNode)) throw new Error(`transition ${n} not found`);
  return e;
}
function wc(t) {
  var n, e;
  t instanceof Tt
    ? ((n = t._id), (t = t._name))
    : ((n = Vr()), ((e = xc).time = Ke()), (t = t == null ? null : t + ""));
  for (var i = this._groups, r = i.length, o = 0; o < r; ++o)
    for (var s = i[o], u = s.length, c, a = 0; a < u; ++a)
      (c = s[a]) && se(c, t, n, a, s, e || vc(c, n));
  return new Tt(i, this._parents, t, n);
}
mn.prototype.interrupt = ya;
mn.prototype.transition = wc;
const He = Math.PI,
  Oe = 2 * He,
  Dt = 1e-6,
  Mc = Oe - Dt;
function Xr(t) {
  this._ += t[0];
  for (let n = 1, e = t.length; n < e; ++n) this._ += arguments[n] + t[n];
}
function bc(t) {
  let n = Math.floor(t);
  if (!(n >= 0)) throw new Error(`invalid digits: ${t}`);
  if (n > 15) return Xr;
  const e = 10 ** n;
  return function (i) {
    this._ += i[0];
    for (let r = 1, o = i.length; r < o; ++r)
      this._ += Math.round(arguments[r] * e) / e + i[r];
  };
}
let Tc = class {
  constructor(n) {
    ((this._x0 = this._y0 = this._x1 = this._y1 = null),
      (this._ = ""),
      (this._append = n == null ? Xr : bc(n)));
  }
  moveTo(n, e) {
    this._append`M${(this._x0 = this._x1 = +n)},${(this._y0 = this._y1 = +e)}`;
  }
  closePath() {
    this._x1 !== null &&
      ((this._x1 = this._x0), (this._y1 = this._y0), this._append`Z`);
  }
  lineTo(n, e) {
    this._append`L${(this._x1 = +n)},${(this._y1 = +e)}`;
  }
  quadraticCurveTo(n, e, i, r) {
    this._append`Q${+n},${+e},${(this._x1 = +i)},${(this._y1 = +r)}`;
  }
  bezierCurveTo(n, e, i, r, o, s) {
    this
      ._append`C${+n},${+e},${+i},${+r},${(this._x1 = +o)},${(this._y1 = +s)}`;
  }
  arcTo(n, e, i, r, o) {
    if (((n = +n), (e = +e), (i = +i), (r = +r), (o = +o), o < 0))
      throw new Error(`negative radius: ${o}`);
    let s = this._x1,
      u = this._y1,
      c = i - n,
      a = r - e,
      h = s - n,
      _ = u - e,
      l = h * h + _ * _;
    if (this._x1 === null) this._append`M${(this._x1 = n)},${(this._y1 = e)}`;
    else if (l > Dt)
      if (!(Math.abs(_ * c - a * h) > Dt) || !o)
        this._append`L${(this._x1 = n)},${(this._y1 = e)}`;
      else {
        let f = i - s,
          m = r - u,
          v = c * c + a * a,
          y = f * f + m * m,
          g = Math.sqrt(v),
          k = Math.sqrt(l),
          C = o * Math.tan((He - Math.acos((v + l - y) / (2 * g * k))) / 2),
          p = C / k,
          S = C / g;
        (Math.abs(p - 1) > Dt && this._append`L${n + p * h},${e + p * _}`,
          this
            ._append`A${o},${o},0,0,${+(_ * f > h * m)},${(this._x1 = n + S * c)},${(this._y1 = e + S * a)}`);
      }
  }
  arc(n, e, i, r, o, s) {
    if (((n = +n), (e = +e), (i = +i), (s = !!s), i < 0))
      throw new Error(`negative radius: ${i}`);
    let u = i * Math.cos(r),
      c = i * Math.sin(r),
      a = n + u,
      h = e + c,
      _ = 1 ^ s,
      l = s ? r - o : o - r;
    (this._x1 === null
      ? this._append`M${a},${h}`
      : (Math.abs(this._x1 - a) > Dt || Math.abs(this._y1 - h) > Dt) &&
        this._append`L${a},${h}`,
      i &&
        (l < 0 && (l = (l % Oe) + Oe),
        l > Mc
          ? this
              ._append`A${i},${i},0,1,${_},${n - u},${e - c}A${i},${i},0,1,${_},${(this._x1 = a)},${(this._y1 = h)}`
          : l > Dt &&
            this
              ._append`A${i},${i},0,${+(l >= He)},${_},${(this._x1 = n + i * Math.cos(o))},${(this._y1 = e + i * Math.sin(o))}`));
  }
  rect(n, e, i, r) {
    this
      ._append`M${(this._x0 = this._x1 = +n)},${(this._y0 = this._y1 = +e)}h${(i = +i)}v${+r}h${-i}Z`;
  }
  toString() {
    return this._;
  }
};
function n0(t, n) {
  var e,
    i = 1;
  (t == null && (t = 0), n == null && (n = 0));
  function r() {
    var o,
      s = e.length,
      u,
      c = 0,
      a = 0;
    for (o = 0; o < s; ++o) ((u = e[o]), (c += u.x), (a += u.y));
    for (c = (c / s - t) * i, a = (a / s - n) * i, o = 0; o < s; ++o)
      ((u = e[o]), (u.x -= c), (u.y -= a));
  }
  return (
    (r.initialize = function (o) {
      e = o;
    }),
    (r.x = function (o) {
      return arguments.length ? ((t = +o), r) : t;
    }),
    (r.y = function (o) {
      return arguments.length ? ((n = +o), r) : n;
    }),
    (r.strength = function (o) {
      return arguments.length ? ((i = +o), r) : i;
    }),
    r
  );
}
function kc(t) {
  const n = +this._x.call(null, t),
    e = +this._y.call(null, t);
  return Wr(this.cover(n, e), n, e, t);
}
function Wr(t, n, e, i) {
  if (isNaN(n) || isNaN(e)) return t;
  var r,
    o = t._root,
    s = { data: i },
    u = t._x0,
    c = t._y0,
    a = t._x1,
    h = t._y1,
    _,
    l,
    f,
    m,
    v,
    y,
    g,
    k;
  if (!o) return ((t._root = s), t);
  for (; o.length; )
    if (
      ((v = n >= (_ = (u + a) / 2)) ? (u = _) : (a = _),
      (y = e >= (l = (c + h) / 2)) ? (c = l) : (h = l),
      (r = o),
      !(o = o[(g = (y << 1) | v)]))
    )
      return ((r[g] = s), t);
  if (
    ((f = +t._x.call(null, o.data)),
    (m = +t._y.call(null, o.data)),
    n === f && e === m)
  )
    return ((s.next = o), r ? (r[g] = s) : (t._root = s), t);
  do
    ((r = r ? (r[g] = new Array(4)) : (t._root = new Array(4))),
      (v = n >= (_ = (u + a) / 2)) ? (u = _) : (a = _),
      (y = e >= (l = (c + h) / 2)) ? (c = l) : (h = l));
  while ((g = (y << 1) | v) === (k = ((m >= l) << 1) | (f >= _)));
  return ((r[k] = o), (r[g] = s), t);
}
function Nc(t) {
  var n,
    e,
    i = t.length,
    r,
    o,
    s = new Array(i),
    u = new Array(i),
    c = 1 / 0,
    a = 1 / 0,
    h = -1 / 0,
    _ = -1 / 0;
  for (e = 0; e < i; ++e)
    isNaN((r = +this._x.call(null, (n = t[e])))) ||
      isNaN((o = +this._y.call(null, n))) ||
      ((s[e] = r),
      (u[e] = o),
      r < c && (c = r),
      r > h && (h = r),
      o < a && (a = o),
      o > _ && (_ = o));
  if (c > h || a > _) return this;
  for (this.cover(c, a).cover(h, _), e = 0; e < i; ++e)
    Wr(this, s[e], u[e], t[e]);
  return this;
}
function Cc(t, n) {
  if (isNaN((t = +t)) || isNaN((n = +n))) return this;
  var e = this._x0,
    i = this._y0,
    r = this._x1,
    o = this._y1;
  if (isNaN(e)) ((r = (e = Math.floor(t)) + 1), (o = (i = Math.floor(n)) + 1));
  else {
    for (
      var s = r - e || 1, u = this._root, c, a;
      e > t || t >= r || i > n || n >= o;

    )
      switch (
        ((a = ((n < i) << 1) | (t < e)),
        (c = new Array(4)),
        (c[a] = u),
        (u = c),
        (s *= 2),
        a)
      ) {
        case 0:
          ((r = e + s), (o = i + s));
          break;
        case 1:
          ((e = r - s), (o = i + s));
          break;
        case 2:
          ((r = e + s), (i = o - s));
          break;
        case 3:
          ((e = r - s), (i = o - s));
          break;
      }
    this._root && this._root.length && (this._root = u);
  }
  return ((this._x0 = e), (this._y0 = i), (this._x1 = r), (this._y1 = o), this);
}
function Sc() {
  var t = [];
  return (
    this.visit(function (n) {
      if (!n.length)
        do t.push(n.data);
        while ((n = n.next));
    }),
    t
  );
}
function Ac(t) {
  return arguments.length
    ? this.cover(+t[0][0], +t[0][1]).cover(+t[1][0], +t[1][1])
    : isNaN(this._x0)
      ? void 0
      : [
          [this._x0, this._y0],
          [this._x1, this._y1],
        ];
}
function it(t, n, e, i, r) {
  ((this.node = t), (this.x0 = n), (this.y0 = e), (this.x1 = i), (this.y1 = r));
}
function $c(t, n, e) {
  var i,
    r = this._x0,
    o = this._y0,
    s,
    u,
    c,
    a,
    h = this._x1,
    _ = this._y1,
    l = [],
    f = this._root,
    m,
    v;
  for (
    f && l.push(new it(f, r, o, h, _)),
      e == null
        ? (e = 1 / 0)
        : ((r = t - e), (o = n - e), (h = t + e), (_ = n + e), (e *= e));
    (m = l.pop());

  )
    if (
      !(
        !(f = m.node) ||
        (s = m.x0) > h ||
        (u = m.y0) > _ ||
        (c = m.x1) < r ||
        (a = m.y1) < o
      )
    )
      if (f.length) {
        var y = (s + c) / 2,
          g = (u + a) / 2;
        (l.push(
          new it(f[3], y, g, c, a),
          new it(f[2], s, g, y, a),
          new it(f[1], y, u, c, g),
          new it(f[0], s, u, y, g)
        ),
          (v = ((n >= g) << 1) | (t >= y)) &&
            ((m = l[l.length - 1]),
            (l[l.length - 1] = l[l.length - 1 - v]),
            (l[l.length - 1 - v] = m)));
      } else {
        var k = t - +this._x.call(null, f.data),
          C = n - +this._y.call(null, f.data),
          p = k * k + C * C;
        if (p < e) {
          var S = Math.sqrt((e = p));
          ((r = t - S), (o = n - S), (h = t + S), (_ = n + S), (i = f.data));
        }
      }
  return i;
}
function Dc(t) {
  if (
    isNaN((h = +this._x.call(null, t))) ||
    isNaN((_ = +this._y.call(null, t)))
  )
    return this;
  var n,
    e = this._root,
    i,
    r,
    o,
    s = this._x0,
    u = this._y0,
    c = this._x1,
    a = this._y1,
    h,
    _,
    l,
    f,
    m,
    v,
    y,
    g;
  if (!e) return this;
  if (e.length)
    for (;;) {
      if (
        ((m = h >= (l = (s + c) / 2)) ? (s = l) : (c = l),
        (v = _ >= (f = (u + a) / 2)) ? (u = f) : (a = f),
        (n = e),
        !(e = e[(y = (v << 1) | m)]))
      )
        return this;
      if (!e.length) break;
      (n[(y + 1) & 3] || n[(y + 2) & 3] || n[(y + 3) & 3]) &&
        ((i = n), (g = y));
    }
  for (; e.data !== t; ) if (((r = e), !(e = e.next))) return this;
  return (
    (o = e.next) && delete e.next,
    r
      ? (o ? (r.next = o) : delete r.next, this)
      : n
        ? (o ? (n[y] = o) : delete n[y],
          (e = n[0] || n[1] || n[2] || n[3]) &&
            e === (n[3] || n[2] || n[1] || n[0]) &&
            !e.length &&
            (i ? (i[g] = e) : (this._root = e)),
          this)
        : ((this._root = o), this)
  );
}
function Ec(t) {
  for (var n = 0, e = t.length; n < e; ++n) this.remove(t[n]);
  return this;
}
function zc() {
  return this._root;
}
function Uc() {
  var t = 0;
  return (
    this.visit(function (n) {
      if (!n.length)
        do ++t;
        while ((n = n.next));
    }),
    t
  );
}
function Lc(t) {
  var n = [],
    e,
    i = this._root,
    r,
    o,
    s,
    u,
    c;
  for (
    i && n.push(new it(i, this._x0, this._y0, this._x1, this._y1));
    (e = n.pop());

  )
    if (
      !t((i = e.node), (o = e.x0), (s = e.y0), (u = e.x1), (c = e.y1)) &&
      i.length
    ) {
      var a = (o + u) / 2,
        h = (s + c) / 2;
      ((r = i[3]) && n.push(new it(r, a, h, u, c)),
        (r = i[2]) && n.push(new it(r, o, h, a, c)),
        (r = i[1]) && n.push(new it(r, a, s, u, h)),
        (r = i[0]) && n.push(new it(r, o, s, a, h)));
    }
  return this;
}
function Fc(t) {
  var n = [],
    e = [],
    i;
  for (
    this._root &&
    n.push(new it(this._root, this._x0, this._y0, this._x1, this._y1));
    (i = n.pop());

  ) {
    var r = i.node;
    if (r.length) {
      var o,
        s = i.x0,
        u = i.y0,
        c = i.x1,
        a = i.y1,
        h = (s + c) / 2,
        _ = (u + a) / 2;
      ((o = r[0]) && n.push(new it(o, s, u, h, _)),
        (o = r[1]) && n.push(new it(o, h, u, c, _)),
        (o = r[2]) && n.push(new it(o, s, _, h, a)),
        (o = r[3]) && n.push(new it(o, h, _, c, a)));
    }
    e.push(i);
  }
  for (; (i = e.pop()); ) t(i.node, i.x0, i.y0, i.x1, i.y1);
  return this;
}
function Rc(t) {
  return t[0];
}
function Pc(t) {
  return arguments.length ? ((this._x = t), this) : this._x;
}
function Ic(t) {
  return t[1];
}
function Yc(t) {
  return arguments.length ? ((this._y = t), this) : this._y;
}
function ni(t, n, e) {
  var i = new ei(n ?? Rc, e ?? Ic, NaN, NaN, NaN, NaN);
  return t == null ? i : i.addAll(t);
}
function ei(t, n, e, i, r, o) {
  ((this._x = t),
    (this._y = n),
    (this._x0 = e),
    (this._y0 = i),
    (this._x1 = r),
    (this._y1 = o),
    (this._root = void 0));
}
function Ei(t) {
  for (var n = { data: t.data }, e = n; (t = t.next); )
    e = e.next = { data: t.data };
  return n;
}
var rt = (ni.prototype = ei.prototype);
rt.copy = function () {
  var t = new ei(this._x, this._y, this._x0, this._y0, this._x1, this._y1),
    n = this._root,
    e,
    i;
  if (!n) return t;
  if (!n.length) return ((t._root = Ei(n)), t);
  for (e = [{ source: n, target: (t._root = new Array(4)) }]; (n = e.pop()); )
    for (var r = 0; r < 4; ++r)
      (i = n.source[r]) &&
        (i.length
          ? e.push({ source: i, target: (n.target[r] = new Array(4)) })
          : (n.target[r] = Ei(i)));
  return t;
};
rt.add = kc;
rt.addAll = Nc;
rt.cover = Cc;
rt.data = Sc;
rt.extent = Ac;
rt.find = $c;
rt.remove = Dc;
rt.removeAll = Ec;
rt.root = zc;
rt.size = Uc;
rt.visit = Lc;
rt.visitAfter = Fc;
rt.x = Pc;
rt.y = Yc;
function Lt(t) {
  return function () {
    return t;
  };
}
function Ct(t) {
  return (t() - 0.5) * 1e-6;
}
function Hc(t) {
  return t.x + t.vx;
}
function Oc(t) {
  return t.y + t.vy;
}
function e0(t) {
  var n,
    e,
    i,
    r = 1,
    o = 1;
  typeof t != "function" && (t = Lt(t == null ? 1 : +t));
  function s() {
    for (var a, h = n.length, _, l, f, m, v, y, g = 0; g < o; ++g)
      for (_ = ni(n, Hc, Oc).visitAfter(u), a = 0; a < h; ++a)
        ((l = n[a]),
          (v = e[l.index]),
          (y = v * v),
          (f = l.x + l.vx),
          (m = l.y + l.vy),
          _.visit(k));
    function k(C, p, S, T, z) {
      var L = C.data,
        I = C.r,
        R = v + I;
      if (L) {
        if (L.index > l.index) {
          var D = f - L.x - L.vx,
            P = m - L.y - L.vy,
            E = D * D + P * P;
          E < R * R &&
            (D === 0 && ((D = Ct(i)), (E += D * D)),
            P === 0 && ((P = Ct(i)), (E += P * P)),
            (E = ((R - (E = Math.sqrt(E))) / E) * r),
            (l.vx += (D *= E) * (R = (I *= I) / (y + I))),
            (l.vy += (P *= E) * R),
            (L.vx -= D * (R = 1 - R)),
            (L.vy -= P * R));
        }
        return;
      }
      return p > f + R || T < f - R || S > m + R || z < m - R;
    }
  }
  function u(a) {
    if (a.data) return (a.r = e[a.data.index]);
    for (var h = (a.r = 0); h < 4; ++h) a[h] && a[h].r > a.r && (a.r = a[h].r);
  }
  function c() {
    if (n) {
      var a,
        h = n.length,
        _;
      for (e = new Array(h), a = 0; a < h; ++a)
        ((_ = n[a]), (e[_.index] = +t(_, a, n)));
    }
  }
  return (
    (s.initialize = function (a, h) {
      ((n = a), (i = h), c());
    }),
    (s.iterations = function (a) {
      return arguments.length ? ((o = +a), s) : o;
    }),
    (s.strength = function (a) {
      return arguments.length ? ((r = +a), s) : r;
    }),
    (s.radius = function (a) {
      return arguments.length
        ? ((t = typeof a == "function" ? a : Lt(+a)), c(), s)
        : t;
    }),
    s
  );
}
function Bc(t) {
  return t.index;
}
function zi(t, n) {
  var e = t.get(n);
  if (!e) throw new Error("node not found: " + n);
  return e;
}
function i0(t) {
  var n = Bc,
    e = _,
    i,
    r = Lt(30),
    o,
    s,
    u,
    c,
    a,
    h = 1;
  t == null && (t = []);
  function _(y) {
    return 1 / Math.min(u[y.source.index], u[y.target.index]);
  }
  function l(y) {
    for (var g = 0, k = t.length; g < h; ++g)
      for (var C = 0, p, S, T, z, L, I, R; C < k; ++C)
        ((p = t[C]),
          (S = p.source),
          (T = p.target),
          (z = T.x + T.vx - S.x - S.vx || Ct(a)),
          (L = T.y + T.vy - S.y - S.vy || Ct(a)),
          (I = Math.sqrt(z * z + L * L)),
          (I = ((I - o[C]) / I) * y * i[C]),
          (z *= I),
          (L *= I),
          (T.vx -= z * (R = c[C])),
          (T.vy -= L * R),
          (S.vx += z * (R = 1 - R)),
          (S.vy += L * R));
  }
  function f() {
    if (s) {
      var y,
        g = s.length,
        k = t.length,
        C = new Map(s.map((S, T) => [n(S, T, s), S])),
        p;
      for (y = 0, u = new Array(g); y < k; ++y)
        ((p = t[y]),
          (p.index = y),
          typeof p.source != "object" && (p.source = zi(C, p.source)),
          typeof p.target != "object" && (p.target = zi(C, p.target)),
          (u[p.source.index] = (u[p.source.index] || 0) + 1),
          (u[p.target.index] = (u[p.target.index] || 0) + 1));
      for (y = 0, c = new Array(k); y < k; ++y)
        ((p = t[y]),
          (c[y] = u[p.source.index] / (u[p.source.index] + u[p.target.index])));
      ((i = new Array(k)), m(), (o = new Array(k)), v());
    }
  }
  function m() {
    if (s) for (var y = 0, g = t.length; y < g; ++y) i[y] = +e(t[y], y, t);
  }
  function v() {
    if (s) for (var y = 0, g = t.length; y < g; ++y) o[y] = +r(t[y], y, t);
  }
  return (
    (l.initialize = function (y, g) {
      ((s = y), (a = g), f());
    }),
    (l.links = function (y) {
      return arguments.length ? ((t = y), f(), l) : t;
    }),
    (l.id = function (y) {
      return arguments.length ? ((n = y), l) : n;
    }),
    (l.iterations = function (y) {
      return arguments.length ? ((h = +y), l) : h;
    }),
    (l.strength = function (y) {
      return arguments.length
        ? ((e = typeof y == "function" ? y : Lt(+y)), m(), l)
        : e;
    }),
    (l.distance = function (y) {
      return arguments.length
        ? ((r = typeof y == "function" ? y : Lt(+y)), v(), l)
        : r;
    }),
    l
  );
}
const qc = 1664525,
  Vc = 1013904223,
  Ui = 4294967296;
function Xc() {
  let t = 1;
  return () => (t = (qc * t + Vc) % Ui) / Ui;
}
function Wc(t) {
  return t.x;
}
function Zc(t) {
  return t.y;
}
var Qc = 10,
  Gc = Math.PI * (3 - Math.sqrt(5));
function r0(t) {
  var n,
    e = 1,
    i = 0.001,
    r = 1 - Math.pow(i, 1 / 300),
    o = 0,
    s = 0.6,
    u = new Map(),
    c = Je(_),
    a = dn("tick", "end"),
    h = Xc();
  t == null && (t = []);
  function _() {
    (l(), a.call("tick", n), e < i && (c.stop(), a.call("end", n)));
  }
  function l(v) {
    var y,
      g = t.length,
      k;
    v === void 0 && (v = 1);
    for (var C = 0; C < v; ++C)
      for (
        e += (o - e) * r,
          u.forEach(function (p) {
            p(e);
          }),
          y = 0;
        y < g;
        ++y
      )
        ((k = t[y]),
          k.fx == null ? (k.x += k.vx *= s) : ((k.x = k.fx), (k.vx = 0)),
          k.fy == null ? (k.y += k.vy *= s) : ((k.y = k.fy), (k.vy = 0)));
    return n;
  }
  function f() {
    for (var v = 0, y = t.length, g; v < y; ++v) {
      if (
        ((g = t[v]),
        (g.index = v),
        g.fx != null && (g.x = g.fx),
        g.fy != null && (g.y = g.fy),
        isNaN(g.x) || isNaN(g.y))
      ) {
        var k = Qc * Math.sqrt(0.5 + v),
          C = v * Gc;
        ((g.x = k * Math.cos(C)), (g.y = k * Math.sin(C)));
      }
      (isNaN(g.vx) || isNaN(g.vy)) && (g.vx = g.vy = 0);
    }
  }
  function m(v) {
    return (v.initialize && v.initialize(t, h), v);
  }
  return (
    f(),
    (n = {
      tick: l,
      restart: function () {
        return (c.restart(_), n);
      },
      stop: function () {
        return (c.stop(), n);
      },
      nodes: function (v) {
        return arguments.length ? ((t = v), f(), u.forEach(m), n) : t;
      },
      alpha: function (v) {
        return arguments.length ? ((e = +v), n) : e;
      },
      alphaMin: function (v) {
        return arguments.length ? ((i = +v), n) : i;
      },
      alphaDecay: function (v) {
        return arguments.length ? ((r = +v), n) : +r;
      },
      alphaTarget: function (v) {
        return arguments.length ? ((o = +v), n) : o;
      },
      velocityDecay: function (v) {
        return arguments.length ? ((s = 1 - v), n) : 1 - s;
      },
      randomSource: function (v) {
        return arguments.length ? ((h = v), u.forEach(m), n) : h;
      },
      force: function (v, y) {
        return arguments.length > 1
          ? (y == null ? u.delete(v) : u.set(v, m(y)), n)
          : u.get(v);
      },
      find: function (v, y, g) {
        var k = 0,
          C = t.length,
          p,
          S,
          T,
          z,
          L;
        for (g == null ? (g = 1 / 0) : (g *= g), k = 0; k < C; ++k)
          ((z = t[k]),
            (p = v - z.x),
            (S = y - z.y),
            (T = p * p + S * S),
            T < g && ((L = z), (g = T)));
        return L;
      },
      on: function (v, y) {
        return arguments.length > 1 ? (a.on(v, y), n) : a.on(v);
      },
    })
  );
}
function o0() {
  var t,
    n,
    e,
    i,
    r = Lt(-30),
    o,
    s = 1,
    u = 1 / 0,
    c = 0.81;
  function a(f) {
    var m,
      v = t.length,
      y = ni(t, Wc, Zc).visitAfter(_);
    for (i = f, m = 0; m < v; ++m) ((n = t[m]), y.visit(l));
  }
  function h() {
    if (t) {
      var f,
        m = t.length,
        v;
      for (o = new Array(m), f = 0; f < m; ++f)
        ((v = t[f]), (o[v.index] = +r(v, f, t)));
    }
  }
  function _(f) {
    var m = 0,
      v,
      y,
      g = 0,
      k,
      C,
      p;
    if (f.length) {
      for (k = C = p = 0; p < 4; ++p)
        (v = f[p]) &&
          (y = Math.abs(v.value)) &&
          ((m += v.value), (g += y), (k += y * v.x), (C += y * v.y));
      ((f.x = k / g), (f.y = C / g));
    } else {
      ((v = f), (v.x = v.data.x), (v.y = v.data.y));
      do m += o[v.data.index];
      while ((v = v.next));
    }
    f.value = m;
  }
  function l(f, m, v, y) {
    if (!f.value) return !0;
    var g = f.x - n.x,
      k = f.y - n.y,
      C = y - m,
      p = g * g + k * k;
    if ((C * C) / c < p)
      return (
        p < u &&
          (g === 0 && ((g = Ct(e)), (p += g * g)),
          k === 0 && ((k = Ct(e)), (p += k * k)),
          p < s && (p = Math.sqrt(s * p)),
          (n.vx += (g * f.value * i) / p),
          (n.vy += (k * f.value * i) / p)),
        !0
      );
    if (f.length || p >= u) return;
    (f.data !== n || f.next) &&
      (g === 0 && ((g = Ct(e)), (p += g * g)),
      k === 0 && ((k = Ct(e)), (p += k * k)),
      p < s && (p = Math.sqrt(s * p)));
    do
      f.data !== n &&
        ((C = (o[f.data.index] * i) / p), (n.vx += g * C), (n.vy += k * C));
    while ((f = f.next));
  }
  return (
    (a.initialize = function (f, m) {
      ((t = f), (e = m), h());
    }),
    (a.strength = function (f) {
      return arguments.length
        ? ((r = typeof f == "function" ? f : Lt(+f)), h(), a)
        : r;
    }),
    (a.distanceMin = function (f) {
      return arguments.length ? ((s = f * f), a) : Math.sqrt(s);
    }),
    (a.distanceMax = function (f) {
      return arguments.length ? ((u = f * f), a) : Math.sqrt(u);
    }),
    (a.theta = function (f) {
      return arguments.length ? ((c = f * f), a) : Math.sqrt(c);
    }),
    a
  );
}
function Kc(t) {
  return Math.abs((t = Math.round(t))) >= 1e21
    ? t.toLocaleString("en").replace(/,/g, "")
    : t.toString(10);
}
function Vn(t, n) {
  if (
    (e = (t = n ? t.toExponential(n - 1) : t.toExponential()).indexOf("e")) < 0
  )
    return null;
  var e,
    i = t.slice(0, e);
  return [i.length > 1 ? i[0] + i.slice(2) : i, +t.slice(e + 1)];
}
function Kt(t) {
  return ((t = Vn(Math.abs(t))), t ? t[1] : NaN);
}
function Jc(t, n) {
  return function (e, i) {
    for (
      var r = e.length, o = [], s = 0, u = t[0], c = 0;
      r > 0 &&
      u > 0 &&
      (c + u + 1 > i && (u = Math.max(1, i - c)),
      o.push(e.substring((r -= u), r + u)),
      !((c += u + 1) > i));

    )
      u = t[(s = (s + 1) % t.length)];
    return o.reverse().join(n);
  };
}
function jc(t) {
  return function (n) {
    return n.replace(/[0-9]/g, function (e) {
      return t[+e];
    });
  };
}
var th =
  /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;
function Xn(t) {
  if (!(n = th.exec(t))) throw new Error("invalid format: " + t);
  var n;
  return new ii({
    fill: n[1],
    align: n[2],
    sign: n[3],
    symbol: n[4],
    zero: n[5],
    width: n[6],
    comma: n[7],
    precision: n[8] && n[8].slice(1),
    trim: n[9],
    type: n[10],
  });
}
Xn.prototype = ii.prototype;
function ii(t) {
  ((this.fill = t.fill === void 0 ? " " : t.fill + ""),
    (this.align = t.align === void 0 ? ">" : t.align + ""),
    (this.sign = t.sign === void 0 ? "-" : t.sign + ""),
    (this.symbol = t.symbol === void 0 ? "" : t.symbol + ""),
    (this.zero = !!t.zero),
    (this.width = t.width === void 0 ? void 0 : +t.width),
    (this.comma = !!t.comma),
    (this.precision = t.precision === void 0 ? void 0 : +t.precision),
    (this.trim = !!t.trim),
    (this.type = t.type === void 0 ? "" : t.type + ""));
}
ii.prototype.toString = function () {
  return (
    this.fill +
    this.align +
    this.sign +
    this.symbol +
    (this.zero ? "0" : "") +
    (this.width === void 0 ? "" : Math.max(1, this.width | 0)) +
    (this.comma ? "," : "") +
    (this.precision === void 0 ? "" : "." + Math.max(0, this.precision | 0)) +
    (this.trim ? "~" : "") +
    this.type
  );
};
function nh(t) {
  t: for (var n = t.length, e = 1, i = -1, r; e < n; ++e)
    switch (t[e]) {
      case ".":
        i = r = e;
        break;
      case "0":
        (i === 0 && (i = e), (r = e));
        break;
      default:
        if (!+t[e]) break t;
        i > 0 && (i = 0);
        break;
    }
  return i > 0 ? t.slice(0, i) + t.slice(r + 1) : t;
}
var Zr;
function eh(t, n) {
  var e = Vn(t, n);
  if (!e) return t + "";
  var i = e[0],
    r = e[1],
    o = r - (Zr = Math.max(-8, Math.min(8, Math.floor(r / 3))) * 3) + 1,
    s = i.length;
  return o === s
    ? i
    : o > s
      ? i + new Array(o - s + 1).join("0")
      : o > 0
        ? i.slice(0, o) + "." + i.slice(o)
        : "0." + new Array(1 - o).join("0") + Vn(t, Math.max(0, n + o - 1))[0];
}
function Li(t, n) {
  var e = Vn(t, n);
  if (!e) return t + "";
  var i = e[0],
    r = e[1];
  return r < 0
    ? "0." + new Array(-r).join("0") + i
    : i.length > r + 1
      ? i.slice(0, r + 1) + "." + i.slice(r + 1)
      : i + new Array(r - i.length + 2).join("0");
}
const Fi = {
  "%": (t, n) => (t * 100).toFixed(n),
  b: t => Math.round(t).toString(2),
  c: t => t + "",
  d: Kc,
  e: (t, n) => t.toExponential(n),
  f: (t, n) => t.toFixed(n),
  g: (t, n) => t.toPrecision(n),
  o: t => Math.round(t).toString(8),
  p: (t, n) => Li(t * 100, n),
  r: Li,
  s: eh,
  X: t => Math.round(t).toString(16).toUpperCase(),
  x: t => Math.round(t).toString(16),
};
function Ri(t) {
  return t;
}
var Pi = Array.prototype.map,
  Ii = [
    "y",
    "z",
    "a",
    "f",
    "p",
    "n",
    "µ",
    "m",
    "",
    "k",
    "M",
    "G",
    "T",
    "P",
    "E",
    "Z",
    "Y",
  ];
function ih(t) {
  var n =
      t.grouping === void 0 || t.thousands === void 0
        ? Ri
        : Jc(Pi.call(t.grouping, Number), t.thousands + ""),
    e = t.currency === void 0 ? "" : t.currency[0] + "",
    i = t.currency === void 0 ? "" : t.currency[1] + "",
    r = t.decimal === void 0 ? "." : t.decimal + "",
    o = t.numerals === void 0 ? Ri : jc(Pi.call(t.numerals, String)),
    s = t.percent === void 0 ? "%" : t.percent + "",
    u = t.minus === void 0 ? "−" : t.minus + "",
    c = t.nan === void 0 ? "NaN" : t.nan + "";
  function a(_) {
    _ = Xn(_);
    var l = _.fill,
      f = _.align,
      m = _.sign,
      v = _.symbol,
      y = _.zero,
      g = _.width,
      k = _.comma,
      C = _.precision,
      p = _.trim,
      S = _.type;
    (S === "n"
      ? ((k = !0), (S = "g"))
      : Fi[S] || (C === void 0 && (C = 12), (p = !0), (S = "g")),
      (y || (l === "0" && f === "=")) && ((y = !0), (l = "0"), (f = "=")));
    var T =
        v === "$"
          ? e
          : v === "#" && /[boxX]/.test(S)
            ? "0" + S.toLowerCase()
            : "",
      z = v === "$" ? i : /[%p]/.test(S) ? s : "",
      L = Fi[S],
      I = /[defgprs%]/.test(S);
    C =
      C === void 0
        ? 6
        : /[gprs]/.test(S)
          ? Math.max(1, Math.min(21, C))
          : Math.max(0, Math.min(20, C));
    function R(D) {
      var P = T,
        E = z,
        d,
        x,
        w;
      if (S === "c") ((E = L(D) + E), (D = ""));
      else {
        D = +D;
        var M = D < 0 || 1 / D < 0;
        if (
          ((D = isNaN(D) ? c : L(Math.abs(D), C)),
          p && (D = nh(D)),
          M && +D == 0 && m !== "+" && (M = !1),
          (P = (M ? (m === "(" ? m : u) : m === "-" || m === "(" ? "" : m) + P),
          (E =
            (S === "s" ? Ii[8 + Zr / 3] : "") +
            E +
            (M && m === "(" ? ")" : "")),
          I)
        ) {
          for (d = -1, x = D.length; ++d < x; )
            if (((w = D.charCodeAt(d)), 48 > w || w > 57)) {
              ((E = (w === 46 ? r + D.slice(d + 1) : D.slice(d)) + E),
                (D = D.slice(0, d)));
              break;
            }
        }
      }
      k && !y && (D = n(D, 1 / 0));
      var N = P.length + D.length + E.length,
        b = N < g ? new Array(g - N + 1).join(l) : "";
      switch (
        (k && y && ((D = n(b + D, b.length ? g - E.length : 1 / 0)), (b = "")),
        f)
      ) {
        case "<":
          D = P + D + E + b;
          break;
        case "=":
          D = P + b + D + E;
          break;
        case "^":
          D = b.slice(0, (N = b.length >> 1)) + P + D + E + b.slice(N);
          break;
        default:
          D = b + P + D + E;
          break;
      }
      return o(D);
    }
    return (
      (R.toString = function () {
        return _ + "";
      }),
      R
    );
  }
  function h(_, l) {
    var f = a(((_ = Xn(_)), (_.type = "f"), _)),
      m = Math.max(-8, Math.min(8, Math.floor(Kt(l) / 3))) * 3,
      v = Math.pow(10, -m),
      y = Ii[8 + m / 3];
    return function (g) {
      return f(v * g) + y;
    };
  }
  return { format: a, formatPrefix: h };
}
var kn, Qr, Gr;
rh({ thousands: ",", grouping: [3], currency: ["$", ""] });
function rh(t) {
  return ((kn = ih(t)), (Qr = kn.format), (Gr = kn.formatPrefix), kn);
}
function oh(t) {
  return Math.max(0, -Kt(Math.abs(t)));
}
function sh(t, n) {
  return Math.max(
    0,
    Math.max(-8, Math.min(8, Math.floor(Kt(n) / 3))) * 3 - Kt(Math.abs(t))
  );
}
function uh(t, n) {
  return (
    (t = Math.abs(t)),
    (n = Math.abs(n) - t),
    Math.max(0, Kt(n) - Kt(t)) + 1
  );
}
function ah(t) {
  var n = 0,
    e = t.children,
    i = e && e.length;
  if (!i) n = 1;
  else for (; --i >= 0; ) n += e[i].value;
  t.value = n;
}
function ch() {
  return this.eachAfter(ah);
}
function hh(t, n) {
  let e = -1;
  for (const i of this) t.call(n, i, ++e, this);
  return this;
}
function lh(t, n) {
  for (var e = this, i = [e], r, o, s = -1; (e = i.pop()); )
    if ((t.call(n, e, ++s, this), (r = e.children)))
      for (o = r.length - 1; o >= 0; --o) i.push(r[o]);
  return this;
}
function fh(t, n) {
  for (var e = this, i = [e], r = [], o, s, u, c = -1; (e = i.pop()); )
    if ((r.push(e), (o = e.children)))
      for (s = 0, u = o.length; s < u; ++s) i.push(o[s]);
  for (; (e = r.pop()); ) t.call(n, e, ++c, this);
  return this;
}
function _h(t, n) {
  let e = -1;
  for (const i of this) if (t.call(n, i, ++e, this)) return i;
}
function gh(t) {
  return this.eachAfter(function (n) {
    for (var e = +t(n.data) || 0, i = n.children, r = i && i.length; --r >= 0; )
      e += i[r].value;
    n.value = e;
  });
}
function ph(t) {
  return this.eachBefore(function (n) {
    n.children && n.children.sort(t);
  });
}
function dh(t) {
  for (var n = this, e = mh(n, t), i = [n]; n !== e; )
    ((n = n.parent), i.push(n));
  for (var r = i.length; t !== e; ) (i.splice(r, 0, t), (t = t.parent));
  return i;
}
function mh(t, n) {
  if (t === n) return t;
  var e = t.ancestors(),
    i = n.ancestors(),
    r = null;
  for (t = e.pop(), n = i.pop(); t === n; )
    ((r = t), (t = e.pop()), (n = i.pop()));
  return r;
}
function yh() {
  for (var t = this, n = [t]; (t = t.parent); ) n.push(t);
  return n;
}
function xh() {
  return Array.from(this);
}
function vh() {
  var t = [];
  return (
    this.eachBefore(function (n) {
      n.children || t.push(n);
    }),
    t
  );
}
function wh() {
  var t = this,
    n = [];
  return (
    t.each(function (e) {
      e !== t && n.push({ source: e.parent, target: e });
    }),
    n
  );
}
function* Mh() {
  var t = this,
    n,
    e = [t],
    i,
    r,
    o;
  do
    for (n = e.reverse(), e = []; (t = n.pop()); )
      if ((yield t, (i = t.children)))
        for (r = 0, o = i.length; r < o; ++r) e.push(i[r]);
  while (e.length);
}
function Kr(t, n) {
  t instanceof Map
    ? ((t = [void 0, t]), n === void 0 && (n = kh))
    : n === void 0 && (n = Th);
  for (var e = new Wn(t), i, r = [e], o, s, u, c; (i = r.pop()); )
    if ((s = n(i.data)) && (c = (s = Array.from(s)).length))
      for (i.children = s, u = c - 1; u >= 0; --u)
        (r.push((o = s[u] = new Wn(s[u]))),
          (o.parent = i),
          (o.depth = i.depth + 1));
  return e.eachBefore(Ch);
}
function bh() {
  return Kr(this).eachBefore(Nh);
}
function Th(t) {
  return t.children;
}
function kh(t) {
  return Array.isArray(t) ? t[1] : null;
}
function Nh(t) {
  (t.data.value !== void 0 && (t.value = t.data.value), (t.data = t.data.data));
}
function Ch(t) {
  var n = 0;
  do t.height = n;
  while ((t = t.parent) && t.height < ++n);
}
function Wn(t) {
  ((this.data = t), (this.depth = this.height = 0), (this.parent = null));
}
Wn.prototype = Kr.prototype = {
  constructor: Wn,
  count: ch,
  each: hh,
  eachAfter: fh,
  eachBefore: lh,
  find: _h,
  sum: gh,
  sort: ph,
  path: dh,
  ancestors: yh,
  descendants: xh,
  leaves: vh,
  links: wh,
  copy: bh,
  [Symbol.iterator]: Mh,
};
function Sh(t) {
  if (typeof t != "function") throw new Error();
  return t;
}
function nn() {
  return 0;
}
function en(t) {
  return function () {
    return t;
  };
}
function Ah(t) {
  ((t.x0 = Math.round(t.x0)),
    (t.y0 = Math.round(t.y0)),
    (t.x1 = Math.round(t.x1)),
    (t.y1 = Math.round(t.y1)));
}
function $h(t, n, e, i, r) {
  for (
    var o = t.children,
      s,
      u = -1,
      c = o.length,
      a = t.value && (i - n) / t.value;
    ++u < c;

  )
    ((s = o[u]), (s.y0 = e), (s.y1 = r), (s.x0 = n), (s.x1 = n += s.value * a));
}
function Dh(t, n, e, i, r) {
  for (
    var o = t.children,
      s,
      u = -1,
      c = o.length,
      a = t.value && (r - e) / t.value;
    ++u < c;

  )
    ((s = o[u]), (s.x0 = n), (s.x1 = i), (s.y0 = e), (s.y1 = e += s.value * a));
}
var Eh = (1 + Math.sqrt(5)) / 2;
function zh(t, n, e, i, r, o) {
  for (
    var s = [],
      u = n.children,
      c,
      a,
      h = 0,
      _ = 0,
      l = u.length,
      f,
      m,
      v = n.value,
      y,
      g,
      k,
      C,
      p,
      S,
      T;
    h < l;

  ) {
    ((f = r - e), (m = o - i));
    do y = u[_++].value;
    while (!y && _ < l);
    for (
      g = k = y,
        S = Math.max(m / f, f / m) / (v * t),
        T = y * y * S,
        p = Math.max(k / T, T / g);
      _ < l;
      ++_
    ) {
      if (
        ((y += a = u[_].value),
        a < g && (g = a),
        a > k && (k = a),
        (T = y * y * S),
        (C = Math.max(k / T, T / g)),
        C > p)
      ) {
        y -= a;
        break;
      }
      p = C;
    }
    (s.push((c = { value: y, dice: f < m, children: u.slice(h, _) })),
      c.dice
        ? $h(c, e, i, r, v ? (i += (m * y) / v) : o)
        : Dh(c, e, i, v ? (e += (f * y) / v) : r, o),
      (v -= y),
      (h = _));
  }
  return s;
}
const Uh = (function t(n) {
  function e(i, r, o, s, u) {
    zh(n, i, r, o, s, u);
  }
  return (
    (e.ratio = function (i) {
      return t((i = +i) > 1 ? i : 1);
    }),
    e
  );
})(Eh);
function s0() {
  var t = Uh,
    n = !1,
    e = 1,
    i = 1,
    r = [0],
    o = nn,
    s = nn,
    u = nn,
    c = nn,
    a = nn;
  function h(l) {
    return (
      (l.x0 = l.y0 = 0),
      (l.x1 = e),
      (l.y1 = i),
      l.eachBefore(_),
      (r = [0]),
      n && l.eachBefore(Ah),
      l
    );
  }
  function _(l) {
    var f = r[l.depth],
      m = l.x0 + f,
      v = l.y0 + f,
      y = l.x1 - f,
      g = l.y1 - f;
    (y < m && (m = y = (m + y) / 2),
      g < v && (v = g = (v + g) / 2),
      (l.x0 = m),
      (l.y0 = v),
      (l.x1 = y),
      (l.y1 = g),
      l.children &&
        ((f = r[l.depth + 1] = o(l) / 2),
        (m += a(l) - f),
        (v += s(l) - f),
        (y -= u(l) - f),
        (g -= c(l) - f),
        y < m && (m = y = (m + y) / 2),
        g < v && (v = g = (v + g) / 2),
        t(l, m, v, y, g)));
  }
  return (
    (h.round = function (l) {
      return arguments.length ? ((n = !!l), h) : n;
    }),
    (h.size = function (l) {
      return arguments.length ? ((e = +l[0]), (i = +l[1]), h) : [e, i];
    }),
    (h.tile = function (l) {
      return arguments.length ? ((t = Sh(l)), h) : t;
    }),
    (h.padding = function (l) {
      return arguments.length
        ? h.paddingInner(l).paddingOuter(l)
        : h.paddingInner();
    }),
    (h.paddingInner = function (l) {
      return arguments.length
        ? ((o = typeof l == "function" ? l : en(+l)), h)
        : o;
    }),
    (h.paddingOuter = function (l) {
      return arguments.length
        ? h.paddingTop(l).paddingRight(l).paddingBottom(l).paddingLeft(l)
        : h.paddingTop();
    }),
    (h.paddingTop = function (l) {
      return arguments.length
        ? ((s = typeof l == "function" ? l : en(+l)), h)
        : s;
    }),
    (h.paddingRight = function (l) {
      return arguments.length
        ? ((u = typeof l == "function" ? l : en(+l)), h)
        : u;
    }),
    (h.paddingBottom = function (l) {
      return arguments.length
        ? ((c = typeof l == "function" ? l : en(+l)), h)
        : c;
    }),
    (h.paddingLeft = function (l) {
      return arguments.length
        ? ((a = typeof l == "function" ? l : en(+l)), h)
        : a;
    }),
    h
  );
}
function ue(t, n) {
  switch (arguments.length) {
    case 0:
      break;
    case 1:
      this.range(t);
      break;
    default:
      this.range(n).domain(t);
      break;
  }
  return this;
}
const Yi = Symbol("implicit");
function Jr() {
  var t = new gi(),
    n = [],
    e = [],
    i = Yi;
  function r(o) {
    let s = t.get(o);
    if (s === void 0) {
      if (i !== Yi) return i;
      t.set(o, (s = n.push(o) - 1));
    }
    return e[s % e.length];
  }
  return (
    (r.domain = function (o) {
      if (!arguments.length) return n.slice();
      ((n = []), (t = new gi()));
      for (const s of o) t.has(s) || t.set(s, n.push(s) - 1);
      return r;
    }),
    (r.range = function (o) {
      return arguments.length ? ((e = Array.from(o)), r) : e.slice();
    }),
    (r.unknown = function (o) {
      return arguments.length ? ((i = o), r) : i;
    }),
    (r.copy = function () {
      return Jr(n, e).unknown(i);
    }),
    ue.apply(r, arguments),
    r
  );
}
function Lh() {
  var t = Jr().unknown(void 0),
    n = t.domain,
    e = t.range,
    i = 0,
    r = 1,
    o,
    s,
    u = !1,
    c = 0,
    a = 0,
    h = 0.5;
  delete t.unknown;
  function _() {
    var l = n().length,
      f = r < i,
      m = f ? r : i,
      v = f ? i : r;
    ((o = (v - m) / Math.max(1, l - c + a * 2)),
      u && (o = Math.floor(o)),
      (m += (v - m - o * (l - c)) * h),
      (s = o * (1 - c)),
      u && ((m = Math.round(m)), (s = Math.round(s))));
    var y = Lo(l).map(function (g) {
      return m + o * g;
    });
    return e(f ? y.reverse() : y);
  }
  return (
    (t.domain = function (l) {
      return arguments.length ? (n(l), _()) : n();
    }),
    (t.range = function (l) {
      return arguments.length
        ? (([i, r] = l), (i = +i), (r = +r), _())
        : [i, r];
    }),
    (t.rangeRound = function (l) {
      return (([i, r] = l), (i = +i), (r = +r), (u = !0), _());
    }),
    (t.bandwidth = function () {
      return s;
    }),
    (t.step = function () {
      return o;
    }),
    (t.round = function (l) {
      return arguments.length ? ((u = !!l), _()) : u;
    }),
    (t.padding = function (l) {
      return arguments.length ? ((c = Math.min(1, (a = +l))), _()) : c;
    }),
    (t.paddingInner = function (l) {
      return arguments.length ? ((c = Math.min(1, l)), _()) : c;
    }),
    (t.paddingOuter = function (l) {
      return arguments.length ? ((a = +l), _()) : a;
    }),
    (t.align = function (l) {
      return arguments.length ? ((h = Math.max(0, Math.min(1, l))), _()) : h;
    }),
    (t.copy = function () {
      return Lh(n(), [i, r]).round(u).paddingInner(c).paddingOuter(a).align(h);
    }),
    ue.apply(_(), arguments)
  );
}
function Fh(t) {
  return function () {
    return t;
  };
}
function Rh(t) {
  return +t;
}
var Hi = [0, 1];
function Bt(t) {
  return t;
}
function Be(t, n) {
  return (n -= t = +t)
    ? function (e) {
        return (e - t) / n;
      }
    : Fh(isNaN(n) ? NaN : 0.5);
}
function Ph(t, n) {
  var e;
  return (
    t > n && ((e = t), (t = n), (n = e)),
    function (i) {
      return Math.max(t, Math.min(n, i));
    }
  );
}
function Ih(t, n, e) {
  var i = t[0],
    r = t[1],
    o = n[0],
    s = n[1];
  return (
    r < i ? ((i = Be(r, i)), (o = e(s, o))) : ((i = Be(i, r)), (o = e(o, s))),
    function (u) {
      return o(i(u));
    }
  );
}
function Yh(t, n, e) {
  var i = Math.min(t.length, n.length) - 1,
    r = new Array(i),
    o = new Array(i),
    s = -1;
  for (
    t[i] < t[0] && ((t = t.slice().reverse()), (n = n.slice().reverse()));
    ++s < i;

  )
    ((r[s] = Be(t[s], t[s + 1])), (o[s] = e(n[s], n[s + 1])));
  return function (u) {
    var c = $o(t, u, 1, i) - 1;
    return o[c](r[c](u));
  };
}
function jr(t, n) {
  return n
    .domain(t.domain())
    .range(t.range())
    .interpolate(t.interpolate())
    .clamp(t.clamp())
    .unknown(t.unknown());
}
function Hh() {
  var t = Hi,
    n = Hi,
    e = Ge,
    i,
    r,
    o,
    s = Bt,
    u,
    c,
    a;
  function h() {
    var l = Math.min(t.length, n.length);
    return (
      s !== Bt && (s = Ph(t[0], t[l - 1])),
      (u = l > 2 ? Yh : Ih),
      (c = a = null),
      _
    );
  }
  function _(l) {
    return l == null || isNaN((l = +l))
      ? o
      : (c || (c = u(t.map(i), n, e)))(i(s(l)));
  }
  return (
    (_.invert = function (l) {
      return s(r((a || (a = u(n, t.map(i), ht)))(l)));
    }),
    (_.domain = function (l) {
      return arguments.length ? ((t = Array.from(l, Rh)), h()) : t.slice();
    }),
    (_.range = function (l) {
      return arguments.length ? ((n = Array.from(l)), h()) : n.slice();
    }),
    (_.rangeRound = function (l) {
      return ((n = Array.from(l)), (e = na), h());
    }),
    (_.clamp = function (l) {
      return arguments.length ? ((s = l ? !0 : Bt), h()) : s !== Bt;
    }),
    (_.interpolate = function (l) {
      return arguments.length ? ((e = l), h()) : e;
    }),
    (_.unknown = function (l) {
      return arguments.length ? ((o = l), _) : o;
    }),
    function (l, f) {
      return ((i = l), (r = f), h());
    }
  );
}
function to() {
  return Hh()(Bt, Bt);
}
function Oh(t, n, e, i) {
  var r = $e(t, n, e),
    o;
  switch (((i = Xn(i ?? ",f")), i.type)) {
    case "s": {
      var s = Math.max(Math.abs(t), Math.abs(n));
      return (
        i.precision == null && !isNaN((o = sh(r, s))) && (i.precision = o),
        Gr(i, s)
      );
    }
    case "":
    case "e":
    case "g":
    case "p":
    case "r": {
      i.precision == null &&
        !isNaN((o = uh(r, Math.max(Math.abs(t), Math.abs(n))))) &&
        (i.precision = o - (i.type === "e"));
      break;
    }
    case "f":
    case "%": {
      i.precision == null &&
        !isNaN((o = oh(r))) &&
        (i.precision = o - (i.type === "%") * 2);
      break;
    }
  }
  return Qr(i);
}
function Bh(t) {
  var n = t.domain;
  return (
    (t.ticks = function (e) {
      var i = n();
      return Uo(i[0], i[i.length - 1], e ?? 10);
    }),
    (t.tickFormat = function (e, i) {
      var r = n();
      return Oh(r[0], r[r.length - 1], e ?? 10, i);
    }),
    (t.nice = function (e) {
      e == null && (e = 10);
      var i = n(),
        r = 0,
        o = i.length - 1,
        s = i[r],
        u = i[o],
        c,
        a,
        h = 10;
      for (
        u < s && ((a = s), (s = u), (u = a), (a = r), (r = o), (o = a));
        h-- > 0;

      ) {
        if (((a = Ae(s, u, e)), a === c)) return ((i[r] = s), (i[o] = u), n(i));
        if (a > 0) ((s = Math.floor(s / a) * a), (u = Math.ceil(u / a) * a));
        else if (a < 0)
          ((s = Math.ceil(s * a) / a), (u = Math.floor(u * a) / a));
        else break;
        c = a;
      }
      return t;
    }),
    t
  );
}
function qh() {
  var t = to();
  return (
    (t.copy = function () {
      return jr(t, qh());
    }),
    ue.apply(t, arguments),
    Bh(t)
  );
}
function Vh(t, n) {
  t = t.slice();
  var e = 0,
    i = t.length - 1,
    r = t[e],
    o = t[i],
    s;
  return (
    o < r && ((s = e), (e = i), (i = s), (s = r), (r = o), (o = s)),
    (t[e] = n.floor(r)),
    (t[i] = n.ceil(o)),
    t
  );
}
const xe = new Date(),
  ve = new Date();
function K(t, n, e, i) {
  function r(o) {
    return (t((o = arguments.length === 0 ? new Date() : new Date(+o))), o);
  }
  return (
    (r.floor = o => (t((o = new Date(+o))), o)),
    (r.ceil = o => (t((o = new Date(o - 1))), n(o, 1), t(o), o)),
    (r.round = o => {
      const s = r(o),
        u = r.ceil(o);
      return o - s < u - o ? s : u;
    }),
    (r.offset = (o, s) => (
      n((o = new Date(+o)), s == null ? 1 : Math.floor(s)),
      o
    )),
    (r.range = (o, s, u) => {
      const c = [];
      if (
        ((o = r.ceil(o)),
        (u = u == null ? 1 : Math.floor(u)),
        !(o < s) || !(u > 0))
      )
        return c;
      let a;
      do (c.push((a = new Date(+o))), n(o, u), t(o));
      while (a < o && o < s);
      return c;
    }),
    (r.filter = o =>
      K(
        s => {
          if (s >= s) for (; t(s), !o(s); ) s.setTime(s - 1);
        },
        (s, u) => {
          if (s >= s)
            if (u < 0) for (; ++u <= 0; ) for (; n(s, -1), !o(s); );
            else for (; --u >= 0; ) for (; n(s, 1), !o(s); );
        }
      )),
    e &&
      ((r.count = (o, s) => (
        xe.setTime(+o),
        ve.setTime(+s),
        t(xe),
        t(ve),
        Math.floor(e(xe, ve))
      )),
      (r.every = o => (
        (o = Math.floor(o)),
        !isFinite(o) || !(o > 0)
          ? null
          : o > 1
            ? r.filter(i ? s => i(s) % o === 0 : s => r.count(0, s) % o === 0)
            : r
      ))),
    r
  );
}
const Zn = K(
  () => {},
  (t, n) => {
    t.setTime(+t + n);
  },
  (t, n) => n - t
);
Zn.every = t => (
  (t = Math.floor(t)),
  !isFinite(t) || !(t > 0)
    ? null
    : t > 1
      ? K(
          n => {
            n.setTime(Math.floor(n / t) * t);
          },
          (n, e) => {
            n.setTime(+n + e * t);
          },
          (n, e) => (e - n) / t
        )
      : Zn
);
Zn.range;
const wt = 1e3,
  ct = wt * 60,
  Mt = ct * 60,
  kt = Mt * 24,
  ri = kt * 7,
  Oi = kt * 30,
  we = kt * 365,
  qt = K(
    t => {
      t.setTime(t - t.getMilliseconds());
    },
    (t, n) => {
      t.setTime(+t + n * wt);
    },
    (t, n) => (n - t) / wt,
    t => t.getUTCSeconds()
  );
qt.range;
const oi = K(
  t => {
    t.setTime(t - t.getMilliseconds() - t.getSeconds() * wt);
  },
  (t, n) => {
    t.setTime(+t + n * ct);
  },
  (t, n) => (n - t) / ct,
  t => t.getMinutes()
);
oi.range;
const Xh = K(
  t => {
    t.setUTCSeconds(0, 0);
  },
  (t, n) => {
    t.setTime(+t + n * ct);
  },
  (t, n) => (n - t) / ct,
  t => t.getUTCMinutes()
);
Xh.range;
const si = K(
  t => {
    t.setTime(
      t - t.getMilliseconds() - t.getSeconds() * wt - t.getMinutes() * ct
    );
  },
  (t, n) => {
    t.setTime(+t + n * Mt);
  },
  (t, n) => (n - t) / Mt,
  t => t.getHours()
);
si.range;
const Wh = K(
  t => {
    t.setUTCMinutes(0, 0, 0);
  },
  (t, n) => {
    t.setTime(+t + n * Mt);
  },
  (t, n) => (n - t) / Mt,
  t => t.getUTCHours()
);
Wh.range;
const xn = K(
  t => t.setHours(0, 0, 0, 0),
  (t, n) => t.setDate(t.getDate() + n),
  (t, n) => (n - t - (n.getTimezoneOffset() - t.getTimezoneOffset()) * ct) / kt,
  t => t.getDate() - 1
);
xn.range;
const ui = K(
  t => {
    t.setUTCHours(0, 0, 0, 0);
  },
  (t, n) => {
    t.setUTCDate(t.getUTCDate() + n);
  },
  (t, n) => (n - t) / kt,
  t => t.getUTCDate() - 1
);
ui.range;
const Zh = K(
  t => {
    t.setUTCHours(0, 0, 0, 0);
  },
  (t, n) => {
    t.setUTCDate(t.getUTCDate() + n);
  },
  (t, n) => (n - t) / kt,
  t => Math.floor(t / kt)
);
Zh.range;
function Yt(t) {
  return K(
    n => {
      (n.setDate(n.getDate() - ((n.getDay() + 7 - t) % 7)),
        n.setHours(0, 0, 0, 0));
    },
    (n, e) => {
      n.setDate(n.getDate() + e * 7);
    },
    (n, e) =>
      (e - n - (e.getTimezoneOffset() - n.getTimezoneOffset()) * ct) / ri
  );
}
const ae = Yt(0),
  Qn = Yt(1),
  Qh = Yt(2),
  Gh = Yt(3),
  Jt = Yt(4),
  Kh = Yt(5),
  Jh = Yt(6);
ae.range;
Qn.range;
Qh.range;
Gh.range;
Jt.range;
Kh.range;
Jh.range;
function Ht(t) {
  return K(
    n => {
      (n.setUTCDate(n.getUTCDate() - ((n.getUTCDay() + 7 - t) % 7)),
        n.setUTCHours(0, 0, 0, 0));
    },
    (n, e) => {
      n.setUTCDate(n.getUTCDate() + e * 7);
    },
    (n, e) => (e - n) / ri
  );
}
const no = Ht(0),
  Gn = Ht(1),
  jh = Ht(2),
  tl = Ht(3),
  jt = Ht(4),
  nl = Ht(5),
  el = Ht(6);
no.range;
Gn.range;
jh.range;
tl.range;
jt.range;
nl.range;
el.range;
const ai = K(
  t => {
    (t.setDate(1), t.setHours(0, 0, 0, 0));
  },
  (t, n) => {
    t.setMonth(t.getMonth() + n);
  },
  (t, n) =>
    n.getMonth() - t.getMonth() + (n.getFullYear() - t.getFullYear()) * 12,
  t => t.getMonth()
);
ai.range;
const il = K(
  t => {
    (t.setUTCDate(1), t.setUTCHours(0, 0, 0, 0));
  },
  (t, n) => {
    t.setUTCMonth(t.getUTCMonth() + n);
  },
  (t, n) =>
    n.getUTCMonth() -
    t.getUTCMonth() +
    (n.getUTCFullYear() - t.getUTCFullYear()) * 12,
  t => t.getUTCMonth()
);
il.range;
const Nt = K(
  t => {
    (t.setMonth(0, 1), t.setHours(0, 0, 0, 0));
  },
  (t, n) => {
    t.setFullYear(t.getFullYear() + n);
  },
  (t, n) => n.getFullYear() - t.getFullYear(),
  t => t.getFullYear()
);
Nt.every = t =>
  !isFinite((t = Math.floor(t))) || !(t > 0)
    ? null
    : K(
        n => {
          (n.setFullYear(Math.floor(n.getFullYear() / t) * t),
            n.setMonth(0, 1),
            n.setHours(0, 0, 0, 0));
        },
        (n, e) => {
          n.setFullYear(n.getFullYear() + e * t);
        }
      );
Nt.range;
const Pt = K(
  t => {
    (t.setUTCMonth(0, 1), t.setUTCHours(0, 0, 0, 0));
  },
  (t, n) => {
    t.setUTCFullYear(t.getUTCFullYear() + n);
  },
  (t, n) => n.getUTCFullYear() - t.getUTCFullYear(),
  t => t.getUTCFullYear()
);
Pt.every = t =>
  !isFinite((t = Math.floor(t))) || !(t > 0)
    ? null
    : K(
        n => {
          (n.setUTCFullYear(Math.floor(n.getUTCFullYear() / t) * t),
            n.setUTCMonth(0, 1),
            n.setUTCHours(0, 0, 0, 0));
        },
        (n, e) => {
          n.setUTCFullYear(n.getUTCFullYear() + e * t);
        }
      );
Pt.range;
function rl(t, n, e, i, r, o) {
  const s = [
    [qt, 1, wt],
    [qt, 5, 5 * wt],
    [qt, 15, 15 * wt],
    [qt, 30, 30 * wt],
    [o, 1, ct],
    [o, 5, 5 * ct],
    [o, 15, 15 * ct],
    [o, 30, 30 * ct],
    [r, 1, Mt],
    [r, 3, 3 * Mt],
    [r, 6, 6 * Mt],
    [r, 12, 12 * Mt],
    [i, 1, kt],
    [i, 2, 2 * kt],
    [e, 1, ri],
    [n, 1, Oi],
    [n, 3, 3 * Oi],
    [t, 1, we],
  ];
  function u(a, h, _) {
    const l = h < a;
    l && ([a, h] = [h, a]);
    const f = _ && typeof _.range == "function" ? _ : c(a, h, _),
      m = f ? f.range(a, +h + 1) : [];
    return l ? m.reverse() : m;
  }
  function c(a, h, _) {
    const l = Math.abs(h - a) / _,
      f = We(([, , y]) => y).right(s, l);
    if (f === s.length) return t.every($e(a / we, h / we, _));
    if (f === 0) return Zn.every(Math.max($e(a, h, _), 1));
    const [m, v] = s[l / s[f - 1][2] < s[f][2] / l ? f - 1 : f];
    return m.every(v);
  }
  return [u, c];
}
const [ol, sl] = rl(Nt, ai, ae, xn, si, oi);
function Me(t) {
  if (0 <= t.y && t.y < 100) {
    var n = new Date(-1, t.m, t.d, t.H, t.M, t.S, t.L);
    return (n.setFullYear(t.y), n);
  }
  return new Date(t.y, t.m, t.d, t.H, t.M, t.S, t.L);
}
function be(t) {
  if (0 <= t.y && t.y < 100) {
    var n = new Date(Date.UTC(-1, t.m, t.d, t.H, t.M, t.S, t.L));
    return (n.setUTCFullYear(t.y), n);
  }
  return new Date(Date.UTC(t.y, t.m, t.d, t.H, t.M, t.S, t.L));
}
function rn(t, n, e) {
  return { y: t, m: n, d: e, H: 0, M: 0, S: 0, L: 0 };
}
function ul(t) {
  var n = t.dateTime,
    e = t.date,
    i = t.time,
    r = t.periods,
    o = t.days,
    s = t.shortDays,
    u = t.months,
    c = t.shortMonths,
    a = on(r),
    h = sn(r),
    _ = on(o),
    l = sn(o),
    f = on(s),
    m = sn(s),
    v = on(u),
    y = sn(u),
    g = on(c),
    k = sn(c),
    C = {
      a: M,
      A: N,
      b,
      B: $,
      c: null,
      d: Zi,
      e: Zi,
      f: $l,
      g: Yl,
      G: Ol,
      H: Cl,
      I: Sl,
      j: Al,
      L: eo,
      m: Dl,
      M: El,
      p: F,
      q: O,
      Q: Ki,
      s: Ji,
      S: zl,
      u: Ul,
      U: Ll,
      V: Fl,
      w: Rl,
      W: Pl,
      x: null,
      X: null,
      y: Il,
      Y: Hl,
      Z: Bl,
      "%": Gi,
    },
    p = {
      a: W,
      A: q,
      b: V,
      B: G,
      c: null,
      d: Qi,
      e: Qi,
      f: Wl,
      g: rf,
      G: sf,
      H: ql,
      I: Vl,
      j: Xl,
      L: ro,
      m: Zl,
      M: Ql,
      p: Z,
      q: et,
      Q: Ki,
      s: Ji,
      S: Gl,
      u: Kl,
      U: Jl,
      V: jl,
      w: tf,
      W: nf,
      x: null,
      X: null,
      y: ef,
      Y: of,
      Z: uf,
      "%": Gi,
    },
    S = {
      a: R,
      A: D,
      b: P,
      B: E,
      c: d,
      d: Xi,
      e: Xi,
      f: bl,
      g: Vi,
      G: qi,
      H: Wi,
      I: Wi,
      j: xl,
      L: Ml,
      m: yl,
      M: vl,
      p: I,
      q: ml,
      Q: kl,
      s: Nl,
      S: wl,
      u: fl,
      U: _l,
      V: gl,
      w: ll,
      W: pl,
      x,
      X: w,
      y: Vi,
      Y: qi,
      Z: dl,
      "%": Tl,
    };
  ((C.x = T(e, C)),
    (C.X = T(i, C)),
    (C.c = T(n, C)),
    (p.x = T(e, p)),
    (p.X = T(i, p)),
    (p.c = T(n, p)));
  function T(U, Y) {
    return function (H) {
      var A = [],
        ot = -1,
        X = 0,
        st = U.length,
        ut,
        At,
        _i;
      for (H instanceof Date || (H = new Date(+H)); ++ot < st; )
        U.charCodeAt(ot) === 37 &&
          (A.push(U.slice(X, ot)),
          (At = Bi[(ut = U.charAt(++ot))]) != null
            ? (ut = U.charAt(++ot))
            : (At = ut === "e" ? " " : "0"),
          (_i = Y[ut]) && (ut = _i(H, At)),
          A.push(ut),
          (X = ot + 1));
      return (A.push(U.slice(X, ot)), A.join(""));
    };
  }
  function z(U, Y) {
    return function (H) {
      var A = rn(1900, void 0, 1),
        ot = L(A, U, (H += ""), 0),
        X,
        st;
      if (ot != H.length) return null;
      if ("Q" in A) return new Date(A.Q);
      if ("s" in A) return new Date(A.s * 1e3 + ("L" in A ? A.L : 0));
      if (
        (Y && !("Z" in A) && (A.Z = 0),
        "p" in A && (A.H = (A.H % 12) + A.p * 12),
        A.m === void 0 && (A.m = "q" in A ? A.q : 0),
        "V" in A)
      ) {
        if (A.V < 1 || A.V > 53) return null;
        ("w" in A || (A.w = 1),
          "Z" in A
            ? ((X = be(rn(A.y, 0, 1))),
              (st = X.getUTCDay()),
              (X = st > 4 || st === 0 ? Gn.ceil(X) : Gn(X)),
              (X = ui.offset(X, (A.V - 1) * 7)),
              (A.y = X.getUTCFullYear()),
              (A.m = X.getUTCMonth()),
              (A.d = X.getUTCDate() + ((A.w + 6) % 7)))
            : ((X = Me(rn(A.y, 0, 1))),
              (st = X.getDay()),
              (X = st > 4 || st === 0 ? Qn.ceil(X) : Qn(X)),
              (X = xn.offset(X, (A.V - 1) * 7)),
              (A.y = X.getFullYear()),
              (A.m = X.getMonth()),
              (A.d = X.getDate() + ((A.w + 6) % 7))));
      } else
        ("W" in A || "U" in A) &&
          ("w" in A || (A.w = "u" in A ? A.u % 7 : "W" in A ? 1 : 0),
          (st =
            "Z" in A
              ? be(rn(A.y, 0, 1)).getUTCDay()
              : Me(rn(A.y, 0, 1)).getDay()),
          (A.m = 0),
          (A.d =
            "W" in A
              ? ((A.w + 6) % 7) + A.W * 7 - ((st + 5) % 7)
              : A.w + A.U * 7 - ((st + 6) % 7)));
      return "Z" in A
        ? ((A.H += (A.Z / 100) | 0), (A.M += A.Z % 100), be(A))
        : Me(A);
    };
  }
  function L(U, Y, H, A) {
    for (var ot = 0, X = Y.length, st = H.length, ut, At; ot < X; ) {
      if (A >= st) return -1;
      if (((ut = Y.charCodeAt(ot++)), ut === 37)) {
        if (
          ((ut = Y.charAt(ot++)),
          (At = S[ut in Bi ? Y.charAt(ot++) : ut]),
          !At || (A = At(U, H, A)) < 0)
        )
          return -1;
      } else if (ut != H.charCodeAt(A++)) return -1;
    }
    return A;
  }
  function I(U, Y, H) {
    var A = a.exec(Y.slice(H));
    return A ? ((U.p = h.get(A[0].toLowerCase())), H + A[0].length) : -1;
  }
  function R(U, Y, H) {
    var A = f.exec(Y.slice(H));
    return A ? ((U.w = m.get(A[0].toLowerCase())), H + A[0].length) : -1;
  }
  function D(U, Y, H) {
    var A = _.exec(Y.slice(H));
    return A ? ((U.w = l.get(A[0].toLowerCase())), H + A[0].length) : -1;
  }
  function P(U, Y, H) {
    var A = g.exec(Y.slice(H));
    return A ? ((U.m = k.get(A[0].toLowerCase())), H + A[0].length) : -1;
  }
  function E(U, Y, H) {
    var A = v.exec(Y.slice(H));
    return A ? ((U.m = y.get(A[0].toLowerCase())), H + A[0].length) : -1;
  }
  function d(U, Y, H) {
    return L(U, n, Y, H);
  }
  function x(U, Y, H) {
    return L(U, e, Y, H);
  }
  function w(U, Y, H) {
    return L(U, i, Y, H);
  }
  function M(U) {
    return s[U.getDay()];
  }
  function N(U) {
    return o[U.getDay()];
  }
  function b(U) {
    return c[U.getMonth()];
  }
  function $(U) {
    return u[U.getMonth()];
  }
  function F(U) {
    return r[+(U.getHours() >= 12)];
  }
  function O(U) {
    return 1 + ~~(U.getMonth() / 3);
  }
  function W(U) {
    return s[U.getUTCDay()];
  }
  function q(U) {
    return o[U.getUTCDay()];
  }
  function V(U) {
    return c[U.getUTCMonth()];
  }
  function G(U) {
    return u[U.getUTCMonth()];
  }
  function Z(U) {
    return r[+(U.getUTCHours() >= 12)];
  }
  function et(U) {
    return 1 + ~~(U.getUTCMonth() / 3);
  }
  return {
    format: function (U) {
      var Y = T((U += ""), C);
      return (
        (Y.toString = function () {
          return U;
        }),
        Y
      );
    },
    parse: function (U) {
      var Y = z((U += ""), !1);
      return (
        (Y.toString = function () {
          return U;
        }),
        Y
      );
    },
    utcFormat: function (U) {
      var Y = T((U += ""), p);
      return (
        (Y.toString = function () {
          return U;
        }),
        Y
      );
    },
    utcParse: function (U) {
      var Y = z((U += ""), !0);
      return (
        (Y.toString = function () {
          return U;
        }),
        Y
      );
    },
  };
}
var Bi = { "-": "", _: " ", 0: "0" },
  J = /^\s*\d+/,
  al = /^%/,
  cl = /[\\^$*+?|[\]().{}]/g;
function B(t, n, e) {
  var i = t < 0 ? "-" : "",
    r = (i ? -t : t) + "",
    o = r.length;
  return i + (o < e ? new Array(e - o + 1).join(n) + r : r);
}
function hl(t) {
  return t.replace(cl, "\\$&");
}
function on(t) {
  return new RegExp("^(?:" + t.map(hl).join("|") + ")", "i");
}
function sn(t) {
  return new Map(t.map((n, e) => [n.toLowerCase(), e]));
}
function ll(t, n, e) {
  var i = J.exec(n.slice(e, e + 1));
  return i ? ((t.w = +i[0]), e + i[0].length) : -1;
}
function fl(t, n, e) {
  var i = J.exec(n.slice(e, e + 1));
  return i ? ((t.u = +i[0]), e + i[0].length) : -1;
}
function _l(t, n, e) {
  var i = J.exec(n.slice(e, e + 2));
  return i ? ((t.U = +i[0]), e + i[0].length) : -1;
}
function gl(t, n, e) {
  var i = J.exec(n.slice(e, e + 2));
  return i ? ((t.V = +i[0]), e + i[0].length) : -1;
}
function pl(t, n, e) {
  var i = J.exec(n.slice(e, e + 2));
  return i ? ((t.W = +i[0]), e + i[0].length) : -1;
}
function qi(t, n, e) {
  var i = J.exec(n.slice(e, e + 4));
  return i ? ((t.y = +i[0]), e + i[0].length) : -1;
}
function Vi(t, n, e) {
  var i = J.exec(n.slice(e, e + 2));
  return i ? ((t.y = +i[0] + (+i[0] > 68 ? 1900 : 2e3)), e + i[0].length) : -1;
}
function dl(t, n, e) {
  var i = /^(Z)|([+-]\d\d)(?::?(\d\d))?/.exec(n.slice(e, e + 6));
  return i
    ? ((t.Z = i[1] ? 0 : -(i[2] + (i[3] || "00"))), e + i[0].length)
    : -1;
}
function ml(t, n, e) {
  var i = J.exec(n.slice(e, e + 1));
  return i ? ((t.q = i[0] * 3 - 3), e + i[0].length) : -1;
}
function yl(t, n, e) {
  var i = J.exec(n.slice(e, e + 2));
  return i ? ((t.m = i[0] - 1), e + i[0].length) : -1;
}
function Xi(t, n, e) {
  var i = J.exec(n.slice(e, e + 2));
  return i ? ((t.d = +i[0]), e + i[0].length) : -1;
}
function xl(t, n, e) {
  var i = J.exec(n.slice(e, e + 3));
  return i ? ((t.m = 0), (t.d = +i[0]), e + i[0].length) : -1;
}
function Wi(t, n, e) {
  var i = J.exec(n.slice(e, e + 2));
  return i ? ((t.H = +i[0]), e + i[0].length) : -1;
}
function vl(t, n, e) {
  var i = J.exec(n.slice(e, e + 2));
  return i ? ((t.M = +i[0]), e + i[0].length) : -1;
}
function wl(t, n, e) {
  var i = J.exec(n.slice(e, e + 2));
  return i ? ((t.S = +i[0]), e + i[0].length) : -1;
}
function Ml(t, n, e) {
  var i = J.exec(n.slice(e, e + 3));
  return i ? ((t.L = +i[0]), e + i[0].length) : -1;
}
function bl(t, n, e) {
  var i = J.exec(n.slice(e, e + 6));
  return i ? ((t.L = Math.floor(i[0] / 1e3)), e + i[0].length) : -1;
}
function Tl(t, n, e) {
  var i = al.exec(n.slice(e, e + 1));
  return i ? e + i[0].length : -1;
}
function kl(t, n, e) {
  var i = J.exec(n.slice(e));
  return i ? ((t.Q = +i[0]), e + i[0].length) : -1;
}
function Nl(t, n, e) {
  var i = J.exec(n.slice(e));
  return i ? ((t.s = +i[0]), e + i[0].length) : -1;
}
function Zi(t, n) {
  return B(t.getDate(), n, 2);
}
function Cl(t, n) {
  return B(t.getHours(), n, 2);
}
function Sl(t, n) {
  return B(t.getHours() % 12 || 12, n, 2);
}
function Al(t, n) {
  return B(1 + xn.count(Nt(t), t), n, 3);
}
function eo(t, n) {
  return B(t.getMilliseconds(), n, 3);
}
function $l(t, n) {
  return eo(t, n) + "000";
}
function Dl(t, n) {
  return B(t.getMonth() + 1, n, 2);
}
function El(t, n) {
  return B(t.getMinutes(), n, 2);
}
function zl(t, n) {
  return B(t.getSeconds(), n, 2);
}
function Ul(t) {
  var n = t.getDay();
  return n === 0 ? 7 : n;
}
function Ll(t, n) {
  return B(ae.count(Nt(t) - 1, t), n, 2);
}
function io(t) {
  var n = t.getDay();
  return n >= 4 || n === 0 ? Jt(t) : Jt.ceil(t);
}
function Fl(t, n) {
  return ((t = io(t)), B(Jt.count(Nt(t), t) + (Nt(t).getDay() === 4), n, 2));
}
function Rl(t) {
  return t.getDay();
}
function Pl(t, n) {
  return B(Qn.count(Nt(t) - 1, t), n, 2);
}
function Il(t, n) {
  return B(t.getFullYear() % 100, n, 2);
}
function Yl(t, n) {
  return ((t = io(t)), B(t.getFullYear() % 100, n, 2));
}
function Hl(t, n) {
  return B(t.getFullYear() % 1e4, n, 4);
}
function Ol(t, n) {
  var e = t.getDay();
  return (
    (t = e >= 4 || e === 0 ? Jt(t) : Jt.ceil(t)),
    B(t.getFullYear() % 1e4, n, 4)
  );
}
function Bl(t) {
  var n = t.getTimezoneOffset();
  return (
    (n > 0 ? "-" : ((n *= -1), "+")) +
    B((n / 60) | 0, "0", 2) +
    B(n % 60, "0", 2)
  );
}
function Qi(t, n) {
  return B(t.getUTCDate(), n, 2);
}
function ql(t, n) {
  return B(t.getUTCHours(), n, 2);
}
function Vl(t, n) {
  return B(t.getUTCHours() % 12 || 12, n, 2);
}
function Xl(t, n) {
  return B(1 + ui.count(Pt(t), t), n, 3);
}
function ro(t, n) {
  return B(t.getUTCMilliseconds(), n, 3);
}
function Wl(t, n) {
  return ro(t, n) + "000";
}
function Zl(t, n) {
  return B(t.getUTCMonth() + 1, n, 2);
}
function Ql(t, n) {
  return B(t.getUTCMinutes(), n, 2);
}
function Gl(t, n) {
  return B(t.getUTCSeconds(), n, 2);
}
function Kl(t) {
  var n = t.getUTCDay();
  return n === 0 ? 7 : n;
}
function Jl(t, n) {
  return B(no.count(Pt(t) - 1, t), n, 2);
}
function oo(t) {
  var n = t.getUTCDay();
  return n >= 4 || n === 0 ? jt(t) : jt.ceil(t);
}
function jl(t, n) {
  return ((t = oo(t)), B(jt.count(Pt(t), t) + (Pt(t).getUTCDay() === 4), n, 2));
}
function tf(t) {
  return t.getUTCDay();
}
function nf(t, n) {
  return B(Gn.count(Pt(t) - 1, t), n, 2);
}
function ef(t, n) {
  return B(t.getUTCFullYear() % 100, n, 2);
}
function rf(t, n) {
  return ((t = oo(t)), B(t.getUTCFullYear() % 100, n, 2));
}
function of(t, n) {
  return B(t.getUTCFullYear() % 1e4, n, 4);
}
function sf(t, n) {
  var e = t.getUTCDay();
  return (
    (t = e >= 4 || e === 0 ? jt(t) : jt.ceil(t)),
    B(t.getUTCFullYear() % 1e4, n, 4)
  );
}
function uf() {
  return "+0000";
}
function Gi() {
  return "%";
}
function Ki(t) {
  return +t;
}
function Ji(t) {
  return Math.floor(+t / 1e3);
}
var Ot, so;
af({
  dateTime: "%x, %X",
  date: "%-m/%-d/%Y",
  time: "%-I:%M:%S %p",
  periods: ["AM", "PM"],
  days: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ],
  shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  months: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  shortMonths: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ],
});
function af(t) {
  return (
    (Ot = ul(t)),
    (so = Ot.format),
    Ot.parse,
    Ot.utcFormat,
    Ot.utcParse,
    Ot
  );
}
function cf(t) {
  return new Date(t);
}
function hf(t) {
  return t instanceof Date ? +t : +new Date(+t);
}
function uo(t, n, e, i, r, o, s, u, c, a) {
  var h = to(),
    _ = h.invert,
    l = h.domain,
    f = a(".%L"),
    m = a(":%S"),
    v = a("%I:%M"),
    y = a("%I %p"),
    g = a("%a %d"),
    k = a("%b %d"),
    C = a("%B"),
    p = a("%Y");
  function S(T) {
    return (
      c(T) < T
        ? f
        : u(T) < T
          ? m
          : s(T) < T
            ? v
            : o(T) < T
              ? y
              : i(T) < T
                ? r(T) < T
                  ? g
                  : k
                : e(T) < T
                  ? C
                  : p
    )(T);
  }
  return (
    (h.invert = function (T) {
      return new Date(_(T));
    }),
    (h.domain = function (T) {
      return arguments.length ? l(Array.from(T, hf)) : l().map(cf);
    }),
    (h.ticks = function (T) {
      var z = l();
      return t(z[0], z[z.length - 1], T ?? 10);
    }),
    (h.tickFormat = function (T, z) {
      return z == null ? S : a(z);
    }),
    (h.nice = function (T) {
      var z = l();
      return (
        (!T || typeof T.range != "function") &&
          (T = n(z[0], z[z.length - 1], T ?? 10)),
        T ? l(Vh(z, T)) : h
      );
    }),
    (h.copy = function () {
      return jr(h, uo(t, n, e, i, r, o, s, u, c, a));
    }),
    h
  );
}
function u0() {
  return ue.apply(
    uo(ol, sl, Nt, ai, ae, xn, si, oi, qt, so).domain([
      new Date(2e3, 0, 1),
      new Date(2e3, 0, 2),
    ]),
    arguments
  );
}
function lf(t) {
  for (var n = (t.length / 6) | 0, e = new Array(n), i = 0; i < n; )
    e[i] = "#" + t.slice(i * 6, ++i * 6);
  return e;
}
const a0 = lf("4e79a7f28e2ce1575976b7b259a14fedc949af7aa1ff9da79c755fbab0ab");
function Q(t) {
  return function () {
    return t;
  };
}
const ji = Math.abs,
  j = Math.atan2,
  $t = Math.cos,
  ff = Math.max,
  Te = Math.min,
  _t = Math.sin,
  Vt = Math.sqrt,
  tt = 1e-12,
  pn = Math.PI,
  Kn = pn / 2,
  Ln = 2 * pn;
function _f(t) {
  return t > 1 ? 0 : t < -1 ? pn : Math.acos(t);
}
function tr(t) {
  return t >= 1 ? Kn : t <= -1 ? -Kn : Math.asin(t);
}
function ao(t) {
  let n = 3;
  return (
    (t.digits = function (e) {
      if (!arguments.length) return n;
      if (e == null) n = null;
      else {
        const i = Math.floor(e);
        if (!(i >= 0)) throw new RangeError(`invalid digits: ${e}`);
        n = i;
      }
      return t;
    }),
    () => new Tc(n)
  );
}
function gf(t) {
  return t.innerRadius;
}
function pf(t) {
  return t.outerRadius;
}
function df(t) {
  return t.startAngle;
}
function mf(t) {
  return t.endAngle;
}
function yf(t) {
  return t && t.padAngle;
}
function xf(t, n, e, i, r, o, s, u) {
  var c = e - t,
    a = i - n,
    h = s - r,
    _ = u - o,
    l = _ * c - h * a;
  if (!(l * l < tt))
    return ((l = (h * (n - o) - _ * (t - r)) / l), [t + l * c, n + l * a]);
}
function Nn(t, n, e, i, r, o, s) {
  var u = t - e,
    c = n - i,
    a = (s ? o : -o) / Vt(u * u + c * c),
    h = a * c,
    _ = -a * u,
    l = t + h,
    f = n + _,
    m = e + h,
    v = i + _,
    y = (l + m) / 2,
    g = (f + v) / 2,
    k = m - l,
    C = v - f,
    p = k * k + C * C,
    S = r - o,
    T = l * v - m * f,
    z = (C < 0 ? -1 : 1) * Vt(ff(0, S * S * p - T * T)),
    L = (T * C - k * z) / p,
    I = (-T * k - C * z) / p,
    R = (T * C + k * z) / p,
    D = (-T * k + C * z) / p,
    P = L - y,
    E = I - g,
    d = R - y,
    x = D - g;
  return (
    P * P + E * E > d * d + x * x && ((L = R), (I = D)),
    {
      cx: L,
      cy: I,
      x01: -h,
      y01: -_,
      x11: L * (r / S - 1),
      y11: I * (r / S - 1),
    }
  );
}
function c0() {
  var t = gf,
    n = pf,
    e = Q(0),
    i = null,
    r = df,
    o = mf,
    s = yf,
    u = null,
    c = ao(a);
  function a() {
    var h,
      _,
      l = +t.apply(this, arguments),
      f = +n.apply(this, arguments),
      m = r.apply(this, arguments) - Kn,
      v = o.apply(this, arguments) - Kn,
      y = ji(v - m),
      g = v > m;
    if ((u || (u = h = c()), f < l && ((_ = f), (f = l), (l = _)), !(f > tt)))
      u.moveTo(0, 0);
    else if (y > Ln - tt)
      (u.moveTo(f * $t(m), f * _t(m)),
        u.arc(0, 0, f, m, v, !g),
        l > tt && (u.moveTo(l * $t(v), l * _t(v)), u.arc(0, 0, l, v, m, g)));
    else {
      var k = m,
        C = v,
        p = m,
        S = v,
        T = y,
        z = y,
        L = s.apply(this, arguments) / 2,
        I = L > tt && (i ? +i.apply(this, arguments) : Vt(l * l + f * f)),
        R = Te(ji(f - l) / 2, +e.apply(this, arguments)),
        D = R,
        P = R,
        E,
        d;
      if (I > tt) {
        var x = tr((I / l) * _t(L)),
          w = tr((I / f) * _t(L));
        ((T -= x * 2) > tt
          ? ((x *= g ? 1 : -1), (p += x), (S -= x))
          : ((T = 0), (p = S = (m + v) / 2)),
          (z -= w * 2) > tt
            ? ((w *= g ? 1 : -1), (k += w), (C -= w))
            : ((z = 0), (k = C = (m + v) / 2)));
      }
      var M = f * $t(k),
        N = f * _t(k),
        b = l * $t(S),
        $ = l * _t(S);
      if (R > tt) {
        var F = f * $t(C),
          O = f * _t(C),
          W = l * $t(p),
          q = l * _t(p),
          V;
        if (y < pn)
          if ((V = xf(M, N, W, q, F, O, b, $))) {
            var G = M - V[0],
              Z = N - V[1],
              et = F - V[0],
              U = O - V[1],
              Y =
                1 /
                _t(
                  _f(
                    (G * et + Z * U) / (Vt(G * G + Z * Z) * Vt(et * et + U * U))
                  ) / 2
                ),
              H = Vt(V[0] * V[0] + V[1] * V[1]);
            ((D = Te(R, (l - H) / (Y - 1))), (P = Te(R, (f - H) / (Y + 1))));
          } else D = P = 0;
      }
      (z > tt
        ? P > tt
          ? ((E = Nn(W, q, M, N, f, P, g)),
            (d = Nn(F, O, b, $, f, P, g)),
            u.moveTo(E.cx + E.x01, E.cy + E.y01),
            P < R
              ? u.arc(E.cx, E.cy, P, j(E.y01, E.x01), j(d.y01, d.x01), !g)
              : (u.arc(E.cx, E.cy, P, j(E.y01, E.x01), j(E.y11, E.x11), !g),
                u.arc(
                  0,
                  0,
                  f,
                  j(E.cy + E.y11, E.cx + E.x11),
                  j(d.cy + d.y11, d.cx + d.x11),
                  !g
                ),
                u.arc(d.cx, d.cy, P, j(d.y11, d.x11), j(d.y01, d.x01), !g)))
          : (u.moveTo(M, N), u.arc(0, 0, f, k, C, !g))
        : u.moveTo(M, N),
        !(l > tt) || !(T > tt)
          ? u.lineTo(b, $)
          : D > tt
            ? ((E = Nn(b, $, F, O, l, -D, g)),
              (d = Nn(M, N, W, q, l, -D, g)),
              u.lineTo(E.cx + E.x01, E.cy + E.y01),
              D < R
                ? u.arc(E.cx, E.cy, D, j(E.y01, E.x01), j(d.y01, d.x01), !g)
                : (u.arc(E.cx, E.cy, D, j(E.y01, E.x01), j(E.y11, E.x11), !g),
                  u.arc(
                    0,
                    0,
                    l,
                    j(E.cy + E.y11, E.cx + E.x11),
                    j(d.cy + d.y11, d.cx + d.x11),
                    g
                  ),
                  u.arc(d.cx, d.cy, D, j(d.y11, d.x11), j(d.y01, d.x01), !g)))
            : u.arc(0, 0, l, S, p, g));
    }
    if ((u.closePath(), h)) return ((u = null), h + "" || null);
  }
  return (
    (a.centroid = function () {
      var h = (+t.apply(this, arguments) + +n.apply(this, arguments)) / 2,
        _ =
          (+r.apply(this, arguments) + +o.apply(this, arguments)) / 2 - pn / 2;
      return [$t(_) * h, _t(_) * h];
    }),
    (a.innerRadius = function (h) {
      return arguments.length
        ? ((t = typeof h == "function" ? h : Q(+h)), a)
        : t;
    }),
    (a.outerRadius = function (h) {
      return arguments.length
        ? ((n = typeof h == "function" ? h : Q(+h)), a)
        : n;
    }),
    (a.cornerRadius = function (h) {
      return arguments.length
        ? ((e = typeof h == "function" ? h : Q(+h)), a)
        : e;
    }),
    (a.padRadius = function (h) {
      return arguments.length
        ? ((i = h == null ? null : typeof h == "function" ? h : Q(+h)), a)
        : i;
    }),
    (a.startAngle = function (h) {
      return arguments.length
        ? ((r = typeof h == "function" ? h : Q(+h)), a)
        : r;
    }),
    (a.endAngle = function (h) {
      return arguments.length
        ? ((o = typeof h == "function" ? h : Q(+h)), a)
        : o;
    }),
    (a.padAngle = function (h) {
      return arguments.length
        ? ((s = typeof h == "function" ? h : Q(+h)), a)
        : s;
    }),
    (a.context = function (h) {
      return arguments.length ? ((u = h ?? null), a) : u;
    }),
    a
  );
}
function co(t) {
  return typeof t == "object" && "length" in t ? t : Array.from(t);
}
function ho(t) {
  this._context = t;
}
ho.prototype = {
  areaStart: function () {
    this._line = 0;
  },
  areaEnd: function () {
    this._line = NaN;
  },
  lineStart: function () {
    this._point = 0;
  },
  lineEnd: function () {
    ((this._line || (this._line !== 0 && this._point === 1)) &&
      this._context.closePath(),
      (this._line = 1 - this._line));
  },
  point: function (t, n) {
    switch (((t = +t), (n = +n), this._point)) {
      case 0:
        ((this._point = 1),
          this._line ? this._context.lineTo(t, n) : this._context.moveTo(t, n));
        break;
      case 1:
        this._point = 2;
      default:
        this._context.lineTo(t, n);
        break;
    }
  },
};
function vf(t) {
  return new ho(t);
}
function wf(t) {
  return t[0];
}
function Mf(t) {
  return t[1];
}
function h0(t, n) {
  var e = Q(!0),
    i = null,
    r = vf,
    o = null,
    s = ao(u);
  ((t = typeof t == "function" ? t : t === void 0 ? wf : Q(t)),
    (n = typeof n == "function" ? n : n === void 0 ? Mf : Q(n)));
  function u(c) {
    var a,
      h = (c = co(c)).length,
      _,
      l = !1,
      f;
    for (i == null && (o = r((f = s()))), a = 0; a <= h; ++a)
      (!(a < h && e((_ = c[a]), a, c)) === l &&
        ((l = !l) ? o.lineStart() : o.lineEnd()),
        l && o.point(+t(_, a, c), +n(_, a, c)));
    if (f) return ((o = null), f + "" || null);
  }
  return (
    (u.x = function (c) {
      return arguments.length
        ? ((t = typeof c == "function" ? c : Q(+c)), u)
        : t;
    }),
    (u.y = function (c) {
      return arguments.length
        ? ((n = typeof c == "function" ? c : Q(+c)), u)
        : n;
    }),
    (u.defined = function (c) {
      return arguments.length
        ? ((e = typeof c == "function" ? c : Q(!!c)), u)
        : e;
    }),
    (u.curve = function (c) {
      return arguments.length ? ((r = c), i != null && (o = r(i)), u) : r;
    }),
    (u.context = function (c) {
      return arguments.length
        ? (c == null ? (i = o = null) : (o = r((i = c))), u)
        : i;
    }),
    u
  );
}
function bf(t, n) {
  return n < t ? -1 : n > t ? 1 : n >= t ? 0 : NaN;
}
function Tf(t) {
  return t;
}
function l0() {
  var t = Tf,
    n = bf,
    e = null,
    i = Q(0),
    r = Q(Ln),
    o = Q(0);
  function s(u) {
    var c,
      a = (u = co(u)).length,
      h,
      _,
      l = 0,
      f = new Array(a),
      m = new Array(a),
      v = +i.apply(this, arguments),
      y = Math.min(Ln, Math.max(-Ln, r.apply(this, arguments) - v)),
      g,
      k = Math.min(Math.abs(y) / a, o.apply(this, arguments)),
      C = k * (y < 0 ? -1 : 1),
      p;
    for (c = 0; c < a; ++c)
      (p = m[(f[c] = c)] = +t(u[c], c, u)) > 0 && (l += p);
    for (
      n != null
        ? f.sort(function (S, T) {
            return n(m[S], m[T]);
          })
        : e != null &&
          f.sort(function (S, T) {
            return e(u[S], u[T]);
          }),
        c = 0,
        _ = l ? (y - a * C) / l : 0;
      c < a;
      ++c, v = g
    )
      ((h = f[c]),
        (p = m[h]),
        (g = v + (p > 0 ? p * _ : 0) + C),
        (m[h] = {
          data: u[h],
          index: c,
          value: p,
          startAngle: v,
          endAngle: g,
          padAngle: k,
        }));
    return m;
  }
  return (
    (s.value = function (u) {
      return arguments.length
        ? ((t = typeof u == "function" ? u : Q(+u)), s)
        : t;
    }),
    (s.sortValues = function (u) {
      return arguments.length ? ((n = u), (e = null), s) : n;
    }),
    (s.sort = function (u) {
      return arguments.length ? ((e = u), (n = null), s) : e;
    }),
    (s.startAngle = function (u) {
      return arguments.length
        ? ((i = typeof u == "function" ? u : Q(+u)), s)
        : i;
    }),
    (s.endAngle = function (u) {
      return arguments.length
        ? ((r = typeof u == "function" ? u : Q(+u)), s)
        : r;
    }),
    (s.padAngle = function (u) {
      return arguments.length
        ? ((o = typeof u == "function" ? u : Q(+u)), s)
        : o;
    }),
    s
  );
}
class lo {
  constructor(n, e) {
    ((this._context = n), (this._x = e));
  }
  areaStart() {
    this._line = 0;
  }
  areaEnd() {
    this._line = NaN;
  }
  lineStart() {
    this._point = 0;
  }
  lineEnd() {
    ((this._line || (this._line !== 0 && this._point === 1)) &&
      this._context.closePath(),
      (this._line = 1 - this._line));
  }
  point(n, e) {
    switch (((n = +n), (e = +e), this._point)) {
      case 0: {
        ((this._point = 1),
          this._line ? this._context.lineTo(n, e) : this._context.moveTo(n, e));
        break;
      }
      case 1:
        this._point = 2;
      default: {
        this._x
          ? this._context.bezierCurveTo(
              (this._x0 = (this._x0 + n) / 2),
              this._y0,
              this._x0,
              e,
              n,
              e
            )
          : this._context.bezierCurveTo(
              this._x0,
              (this._y0 = (this._y0 + e) / 2),
              n,
              this._y0,
              n,
              e
            );
        break;
      }
    }
    ((this._x0 = n), (this._y0 = e));
  }
}
function f0(t) {
  return new lo(t, !0);
}
function _0(t) {
  return new lo(t, !1);
}
function St() {}
function Jn(t, n, e) {
  t._context.bezierCurveTo(
    (2 * t._x0 + t._x1) / 3,
    (2 * t._y0 + t._y1) / 3,
    (t._x0 + 2 * t._x1) / 3,
    (t._y0 + 2 * t._y1) / 3,
    (t._x0 + 4 * t._x1 + n) / 6,
    (t._y0 + 4 * t._y1 + e) / 6
  );
}
function ce(t) {
  this._context = t;
}
ce.prototype = {
  areaStart: function () {
    this._line = 0;
  },
  areaEnd: function () {
    this._line = NaN;
  },
  lineStart: function () {
    ((this._x0 = this._x1 = this._y0 = this._y1 = NaN), (this._point = 0));
  },
  lineEnd: function () {
    switch (this._point) {
      case 3:
        Jn(this, this._x1, this._y1);
      case 2:
        this._context.lineTo(this._x1, this._y1);
        break;
    }
    ((this._line || (this._line !== 0 && this._point === 1)) &&
      this._context.closePath(),
      (this._line = 1 - this._line));
  },
  point: function (t, n) {
    switch (((t = +t), (n = +n), this._point)) {
      case 0:
        ((this._point = 1),
          this._line ? this._context.lineTo(t, n) : this._context.moveTo(t, n));
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        ((this._point = 3),
          this._context.lineTo(
            (5 * this._x0 + this._x1) / 6,
            (5 * this._y0 + this._y1) / 6
          ));
      default:
        Jn(this, t, n);
        break;
    }
    ((this._x0 = this._x1),
      (this._x1 = t),
      (this._y0 = this._y1),
      (this._y1 = n));
  },
};
function g0(t) {
  return new ce(t);
}
function fo(t) {
  this._context = t;
}
fo.prototype = {
  areaStart: St,
  areaEnd: St,
  lineStart: function () {
    ((this._x0 =
      this._x1 =
      this._x2 =
      this._x3 =
      this._x4 =
      this._y0 =
      this._y1 =
      this._y2 =
      this._y3 =
      this._y4 =
        NaN),
      (this._point = 0));
  },
  lineEnd: function () {
    switch (this._point) {
      case 1: {
        (this._context.moveTo(this._x2, this._y2), this._context.closePath());
        break;
      }
      case 2: {
        (this._context.moveTo(
          (this._x2 + 2 * this._x3) / 3,
          (this._y2 + 2 * this._y3) / 3
        ),
          this._context.lineTo(
            (this._x3 + 2 * this._x2) / 3,
            (this._y3 + 2 * this._y2) / 3
          ),
          this._context.closePath());
        break;
      }
      case 3: {
        (this.point(this._x2, this._y2),
          this.point(this._x3, this._y3),
          this.point(this._x4, this._y4));
        break;
      }
    }
  },
  point: function (t, n) {
    switch (((t = +t), (n = +n), this._point)) {
      case 0:
        ((this._point = 1), (this._x2 = t), (this._y2 = n));
        break;
      case 1:
        ((this._point = 2), (this._x3 = t), (this._y3 = n));
        break;
      case 2:
        ((this._point = 3),
          (this._x4 = t),
          (this._y4 = n),
          this._context.moveTo(
            (this._x0 + 4 * this._x1 + t) / 6,
            (this._y0 + 4 * this._y1 + n) / 6
          ));
        break;
      default:
        Jn(this, t, n);
        break;
    }
    ((this._x0 = this._x1),
      (this._x1 = t),
      (this._y0 = this._y1),
      (this._y1 = n));
  },
};
function p0(t) {
  return new fo(t);
}
function _o(t) {
  this._context = t;
}
_o.prototype = {
  areaStart: function () {
    this._line = 0;
  },
  areaEnd: function () {
    this._line = NaN;
  },
  lineStart: function () {
    ((this._x0 = this._x1 = this._y0 = this._y1 = NaN), (this._point = 0));
  },
  lineEnd: function () {
    ((this._line || (this._line !== 0 && this._point === 3)) &&
      this._context.closePath(),
      (this._line = 1 - this._line));
  },
  point: function (t, n) {
    switch (((t = +t), (n = +n), this._point)) {
      case 0:
        this._point = 1;
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        this._point = 3;
        var e = (this._x0 + 4 * this._x1 + t) / 6,
          i = (this._y0 + 4 * this._y1 + n) / 6;
        this._line ? this._context.lineTo(e, i) : this._context.moveTo(e, i);
        break;
      case 3:
        this._point = 4;
      default:
        Jn(this, t, n);
        break;
    }
    ((this._x0 = this._x1),
      (this._x1 = t),
      (this._y0 = this._y1),
      (this._y1 = n));
  },
};
function d0(t) {
  return new _o(t);
}
function go(t, n) {
  ((this._basis = new ce(t)), (this._beta = n));
}
go.prototype = {
  lineStart: function () {
    ((this._x = []), (this._y = []), this._basis.lineStart());
  },
  lineEnd: function () {
    var t = this._x,
      n = this._y,
      e = t.length - 1;
    if (e > 0)
      for (
        var i = t[0], r = n[0], o = t[e] - i, s = n[e] - r, u = -1, c;
        ++u <= e;

      )
        ((c = u / e),
          this._basis.point(
            this._beta * t[u] + (1 - this._beta) * (i + c * o),
            this._beta * n[u] + (1 - this._beta) * (r + c * s)
          ));
    ((this._x = this._y = null), this._basis.lineEnd());
  },
  point: function (t, n) {
    (this._x.push(+t), this._y.push(+n));
  },
};
const m0 = (function t(n) {
  function e(i) {
    return n === 1 ? new ce(i) : new go(i, n);
  }
  return (
    (e.beta = function (i) {
      return t(+i);
    }),
    e
  );
})(0.85);
function jn(t, n, e) {
  t._context.bezierCurveTo(
    t._x1 + t._k * (t._x2 - t._x0),
    t._y1 + t._k * (t._y2 - t._y0),
    t._x2 + t._k * (t._x1 - n),
    t._y2 + t._k * (t._y1 - e),
    t._x2,
    t._y2
  );
}
function ci(t, n) {
  ((this._context = t), (this._k = (1 - n) / 6));
}
ci.prototype = {
  areaStart: function () {
    this._line = 0;
  },
  areaEnd: function () {
    this._line = NaN;
  },
  lineStart: function () {
    ((this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN),
      (this._point = 0));
  },
  lineEnd: function () {
    switch (this._point) {
      case 2:
        this._context.lineTo(this._x2, this._y2);
        break;
      case 3:
        jn(this, this._x1, this._y1);
        break;
    }
    ((this._line || (this._line !== 0 && this._point === 1)) &&
      this._context.closePath(),
      (this._line = 1 - this._line));
  },
  point: function (t, n) {
    switch (((t = +t), (n = +n), this._point)) {
      case 0:
        ((this._point = 1),
          this._line ? this._context.lineTo(t, n) : this._context.moveTo(t, n));
        break;
      case 1:
        ((this._point = 2), (this._x1 = t), (this._y1 = n));
        break;
      case 2:
        this._point = 3;
      default:
        jn(this, t, n);
        break;
    }
    ((this._x0 = this._x1),
      (this._x1 = this._x2),
      (this._x2 = t),
      (this._y0 = this._y1),
      (this._y1 = this._y2),
      (this._y2 = n));
  },
};
const y0 = (function t(n) {
  function e(i) {
    return new ci(i, n);
  }
  return (
    (e.tension = function (i) {
      return t(+i);
    }),
    e
  );
})(0);
function hi(t, n) {
  ((this._context = t), (this._k = (1 - n) / 6));
}
hi.prototype = {
  areaStart: St,
  areaEnd: St,
  lineStart: function () {
    ((this._x0 =
      this._x1 =
      this._x2 =
      this._x3 =
      this._x4 =
      this._x5 =
      this._y0 =
      this._y1 =
      this._y2 =
      this._y3 =
      this._y4 =
      this._y5 =
        NaN),
      (this._point = 0));
  },
  lineEnd: function () {
    switch (this._point) {
      case 1: {
        (this._context.moveTo(this._x3, this._y3), this._context.closePath());
        break;
      }
      case 2: {
        (this._context.lineTo(this._x3, this._y3), this._context.closePath());
        break;
      }
      case 3: {
        (this.point(this._x3, this._y3),
          this.point(this._x4, this._y4),
          this.point(this._x5, this._y5));
        break;
      }
    }
  },
  point: function (t, n) {
    switch (((t = +t), (n = +n), this._point)) {
      case 0:
        ((this._point = 1), (this._x3 = t), (this._y3 = n));
        break;
      case 1:
        ((this._point = 2),
          this._context.moveTo((this._x4 = t), (this._y4 = n)));
        break;
      case 2:
        ((this._point = 3), (this._x5 = t), (this._y5 = n));
        break;
      default:
        jn(this, t, n);
        break;
    }
    ((this._x0 = this._x1),
      (this._x1 = this._x2),
      (this._x2 = t),
      (this._y0 = this._y1),
      (this._y1 = this._y2),
      (this._y2 = n));
  },
};
const x0 = (function t(n) {
  function e(i) {
    return new hi(i, n);
  }
  return (
    (e.tension = function (i) {
      return t(+i);
    }),
    e
  );
})(0);
function li(t, n) {
  ((this._context = t), (this._k = (1 - n) / 6));
}
li.prototype = {
  areaStart: function () {
    this._line = 0;
  },
  areaEnd: function () {
    this._line = NaN;
  },
  lineStart: function () {
    ((this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN),
      (this._point = 0));
  },
  lineEnd: function () {
    ((this._line || (this._line !== 0 && this._point === 3)) &&
      this._context.closePath(),
      (this._line = 1 - this._line));
  },
  point: function (t, n) {
    switch (((t = +t), (n = +n), this._point)) {
      case 0:
        this._point = 1;
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        ((this._point = 3),
          this._line
            ? this._context.lineTo(this._x2, this._y2)
            : this._context.moveTo(this._x2, this._y2));
        break;
      case 3:
        this._point = 4;
      default:
        jn(this, t, n);
        break;
    }
    ((this._x0 = this._x1),
      (this._x1 = this._x2),
      (this._x2 = t),
      (this._y0 = this._y1),
      (this._y1 = this._y2),
      (this._y2 = n));
  },
};
const v0 = (function t(n) {
  function e(i) {
    return new li(i, n);
  }
  return (
    (e.tension = function (i) {
      return t(+i);
    }),
    e
  );
})(0);
function fi(t, n, e) {
  var i = t._x1,
    r = t._y1,
    o = t._x2,
    s = t._y2;
  if (t._l01_a > tt) {
    var u = 2 * t._l01_2a + 3 * t._l01_a * t._l12_a + t._l12_2a,
      c = 3 * t._l01_a * (t._l01_a + t._l12_a);
    ((i = (i * u - t._x0 * t._l12_2a + t._x2 * t._l01_2a) / c),
      (r = (r * u - t._y0 * t._l12_2a + t._y2 * t._l01_2a) / c));
  }
  if (t._l23_a > tt) {
    var a = 2 * t._l23_2a + 3 * t._l23_a * t._l12_a + t._l12_2a,
      h = 3 * t._l23_a * (t._l23_a + t._l12_a);
    ((o = (o * a + t._x1 * t._l23_2a - n * t._l12_2a) / h),
      (s = (s * a + t._y1 * t._l23_2a - e * t._l12_2a) / h));
  }
  t._context.bezierCurveTo(i, r, o, s, t._x2, t._y2);
}
function po(t, n) {
  ((this._context = t), (this._alpha = n));
}
po.prototype = {
  areaStart: function () {
    this._line = 0;
  },
  areaEnd: function () {
    this._line = NaN;
  },
  lineStart: function () {
    ((this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN),
      (this._l01_a =
        this._l12_a =
        this._l23_a =
        this._l01_2a =
        this._l12_2a =
        this._l23_2a =
        this._point =
          0));
  },
  lineEnd: function () {
    switch (this._point) {
      case 2:
        this._context.lineTo(this._x2, this._y2);
        break;
      case 3:
        this.point(this._x2, this._y2);
        break;
    }
    ((this._line || (this._line !== 0 && this._point === 1)) &&
      this._context.closePath(),
      (this._line = 1 - this._line));
  },
  point: function (t, n) {
    if (((t = +t), (n = +n), this._point)) {
      var e = this._x2 - t,
        i = this._y2 - n;
      this._l23_a = Math.sqrt(
        (this._l23_2a = Math.pow(e * e + i * i, this._alpha))
      );
    }
    switch (this._point) {
      case 0:
        ((this._point = 1),
          this._line ? this._context.lineTo(t, n) : this._context.moveTo(t, n));
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        this._point = 3;
      default:
        fi(this, t, n);
        break;
    }
    ((this._l01_a = this._l12_a),
      (this._l12_a = this._l23_a),
      (this._l01_2a = this._l12_2a),
      (this._l12_2a = this._l23_2a),
      (this._x0 = this._x1),
      (this._x1 = this._x2),
      (this._x2 = t),
      (this._y0 = this._y1),
      (this._y1 = this._y2),
      (this._y2 = n));
  },
};
const w0 = (function t(n) {
  function e(i) {
    return n ? new po(i, n) : new ci(i, 0);
  }
  return (
    (e.alpha = function (i) {
      return t(+i);
    }),
    e
  );
})(0.5);
function mo(t, n) {
  ((this._context = t), (this._alpha = n));
}
mo.prototype = {
  areaStart: St,
  areaEnd: St,
  lineStart: function () {
    ((this._x0 =
      this._x1 =
      this._x2 =
      this._x3 =
      this._x4 =
      this._x5 =
      this._y0 =
      this._y1 =
      this._y2 =
      this._y3 =
      this._y4 =
      this._y5 =
        NaN),
      (this._l01_a =
        this._l12_a =
        this._l23_a =
        this._l01_2a =
        this._l12_2a =
        this._l23_2a =
        this._point =
          0));
  },
  lineEnd: function () {
    switch (this._point) {
      case 1: {
        (this._context.moveTo(this._x3, this._y3), this._context.closePath());
        break;
      }
      case 2: {
        (this._context.lineTo(this._x3, this._y3), this._context.closePath());
        break;
      }
      case 3: {
        (this.point(this._x3, this._y3),
          this.point(this._x4, this._y4),
          this.point(this._x5, this._y5));
        break;
      }
    }
  },
  point: function (t, n) {
    if (((t = +t), (n = +n), this._point)) {
      var e = this._x2 - t,
        i = this._y2 - n;
      this._l23_a = Math.sqrt(
        (this._l23_2a = Math.pow(e * e + i * i, this._alpha))
      );
    }
    switch (this._point) {
      case 0:
        ((this._point = 1), (this._x3 = t), (this._y3 = n));
        break;
      case 1:
        ((this._point = 2),
          this._context.moveTo((this._x4 = t), (this._y4 = n)));
        break;
      case 2:
        ((this._point = 3), (this._x5 = t), (this._y5 = n));
        break;
      default:
        fi(this, t, n);
        break;
    }
    ((this._l01_a = this._l12_a),
      (this._l12_a = this._l23_a),
      (this._l01_2a = this._l12_2a),
      (this._l12_2a = this._l23_2a),
      (this._x0 = this._x1),
      (this._x1 = this._x2),
      (this._x2 = t),
      (this._y0 = this._y1),
      (this._y1 = this._y2),
      (this._y2 = n));
  },
};
const M0 = (function t(n) {
  function e(i) {
    return n ? new mo(i, n) : new hi(i, 0);
  }
  return (
    (e.alpha = function (i) {
      return t(+i);
    }),
    e
  );
})(0.5);
function yo(t, n) {
  ((this._context = t), (this._alpha = n));
}
yo.prototype = {
  areaStart: function () {
    this._line = 0;
  },
  areaEnd: function () {
    this._line = NaN;
  },
  lineStart: function () {
    ((this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN),
      (this._l01_a =
        this._l12_a =
        this._l23_a =
        this._l01_2a =
        this._l12_2a =
        this._l23_2a =
        this._point =
          0));
  },
  lineEnd: function () {
    ((this._line || (this._line !== 0 && this._point === 3)) &&
      this._context.closePath(),
      (this._line = 1 - this._line));
  },
  point: function (t, n) {
    if (((t = +t), (n = +n), this._point)) {
      var e = this._x2 - t,
        i = this._y2 - n;
      this._l23_a = Math.sqrt(
        (this._l23_2a = Math.pow(e * e + i * i, this._alpha))
      );
    }
    switch (this._point) {
      case 0:
        this._point = 1;
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        ((this._point = 3),
          this._line
            ? this._context.lineTo(this._x2, this._y2)
            : this._context.moveTo(this._x2, this._y2));
        break;
      case 3:
        this._point = 4;
      default:
        fi(this, t, n);
        break;
    }
    ((this._l01_a = this._l12_a),
      (this._l12_a = this._l23_a),
      (this._l01_2a = this._l12_2a),
      (this._l12_2a = this._l23_2a),
      (this._x0 = this._x1),
      (this._x1 = this._x2),
      (this._x2 = t),
      (this._y0 = this._y1),
      (this._y1 = this._y2),
      (this._y2 = n));
  },
};
const b0 = (function t(n) {
  function e(i) {
    return n ? new yo(i, n) : new li(i, 0);
  }
  return (
    (e.alpha = function (i) {
      return t(+i);
    }),
    e
  );
})(0.5);
function xo(t) {
  this._context = t;
}
xo.prototype = {
  areaStart: St,
  areaEnd: St,
  lineStart: function () {
    this._point = 0;
  },
  lineEnd: function () {
    this._point && this._context.closePath();
  },
  point: function (t, n) {
    ((t = +t),
      (n = +n),
      this._point
        ? this._context.lineTo(t, n)
        : ((this._point = 1), this._context.moveTo(t, n)));
  },
};
function T0(t) {
  return new xo(t);
}
function nr(t) {
  return t < 0 ? -1 : 1;
}
function er(t, n, e) {
  var i = t._x1 - t._x0,
    r = n - t._x1,
    o = (t._y1 - t._y0) / (i || (r < 0 && -0)),
    s = (e - t._y1) / (r || (i < 0 && -0)),
    u = (o * r + s * i) / (i + r);
  return (
    (nr(o) + nr(s)) * Math.min(Math.abs(o), Math.abs(s), 0.5 * Math.abs(u)) || 0
  );
}
function ir(t, n) {
  var e = t._x1 - t._x0;
  return e ? ((3 * (t._y1 - t._y0)) / e - n) / 2 : n;
}
function ke(t, n, e) {
  var i = t._x0,
    r = t._y0,
    o = t._x1,
    s = t._y1,
    u = (o - i) / 3;
  t._context.bezierCurveTo(i + u, r + u * n, o - u, s - u * e, o, s);
}
function te(t) {
  this._context = t;
}
te.prototype = {
  areaStart: function () {
    this._line = 0;
  },
  areaEnd: function () {
    this._line = NaN;
  },
  lineStart: function () {
    ((this._x0 = this._x1 = this._y0 = this._y1 = this._t0 = NaN),
      (this._point = 0));
  },
  lineEnd: function () {
    switch (this._point) {
      case 2:
        this._context.lineTo(this._x1, this._y1);
        break;
      case 3:
        ke(this, this._t0, ir(this, this._t0));
        break;
    }
    ((this._line || (this._line !== 0 && this._point === 1)) &&
      this._context.closePath(),
      (this._line = 1 - this._line));
  },
  point: function (t, n) {
    var e = NaN;
    if (((t = +t), (n = +n), !(t === this._x1 && n === this._y1))) {
      switch (this._point) {
        case 0:
          ((this._point = 1),
            this._line
              ? this._context.lineTo(t, n)
              : this._context.moveTo(t, n));
          break;
        case 1:
          this._point = 2;
          break;
        case 2:
          ((this._point = 3), ke(this, ir(this, (e = er(this, t, n))), e));
          break;
        default:
          ke(this, this._t0, (e = er(this, t, n)));
          break;
      }
      ((this._x0 = this._x1),
        (this._x1 = t),
        (this._y0 = this._y1),
        (this._y1 = n),
        (this._t0 = e));
    }
  },
};
function vo(t) {
  this._context = new wo(t);
}
(vo.prototype = Object.create(te.prototype)).point = function (t, n) {
  te.prototype.point.call(this, n, t);
};
function wo(t) {
  this._context = t;
}
wo.prototype = {
  moveTo: function (t, n) {
    this._context.moveTo(n, t);
  },
  closePath: function () {
    this._context.closePath();
  },
  lineTo: function (t, n) {
    this._context.lineTo(n, t);
  },
  bezierCurveTo: function (t, n, e, i, r, o) {
    this._context.bezierCurveTo(n, t, i, e, o, r);
  },
};
function k0(t) {
  return new te(t);
}
function N0(t) {
  return new vo(t);
}
function Mo(t) {
  this._context = t;
}
Mo.prototype = {
  areaStart: function () {
    this._line = 0;
  },
  areaEnd: function () {
    this._line = NaN;
  },
  lineStart: function () {
    ((this._x = []), (this._y = []));
  },
  lineEnd: function () {
    var t = this._x,
      n = this._y,
      e = t.length;
    if (e)
      if (
        (this._line
          ? this._context.lineTo(t[0], n[0])
          : this._context.moveTo(t[0], n[0]),
        e === 2)
      )
        this._context.lineTo(t[1], n[1]);
      else
        for (var i = rr(t), r = rr(n), o = 0, s = 1; s < e; ++o, ++s)
          this._context.bezierCurveTo(
            i[0][o],
            r[0][o],
            i[1][o],
            r[1][o],
            t[s],
            n[s]
          );
    ((this._line || (this._line !== 0 && e === 1)) && this._context.closePath(),
      (this._line = 1 - this._line),
      (this._x = this._y = null));
  },
  point: function (t, n) {
    (this._x.push(+t), this._y.push(+n));
  },
};
function rr(t) {
  var n,
    e = t.length - 1,
    i,
    r = new Array(e),
    o = new Array(e),
    s = new Array(e);
  for (r[0] = 0, o[0] = 2, s[0] = t[0] + 2 * t[1], n = 1; n < e - 1; ++n)
    ((r[n] = 1), (o[n] = 4), (s[n] = 4 * t[n] + 2 * t[n + 1]));
  for (
    r[e - 1] = 2, o[e - 1] = 7, s[e - 1] = 8 * t[e - 1] + t[e], n = 1;
    n < e;
    ++n
  )
    ((i = r[n] / o[n - 1]), (o[n] -= i), (s[n] -= i * s[n - 1]));
  for (r[e - 1] = s[e - 1] / o[e - 1], n = e - 2; n >= 0; --n)
    r[n] = (s[n] - r[n + 1]) / o[n];
  for (o[e - 1] = (t[e] + r[e - 1]) / 2, n = 0; n < e - 1; ++n)
    o[n] = 2 * t[n + 1] - r[n + 1];
  return [r, o];
}
function C0(t) {
  return new Mo(t);
}
function he(t, n) {
  ((this._context = t), (this._t = n));
}
he.prototype = {
  areaStart: function () {
    this._line = 0;
  },
  areaEnd: function () {
    this._line = NaN;
  },
  lineStart: function () {
    ((this._x = this._y = NaN), (this._point = 0));
  },
  lineEnd: function () {
    (0 < this._t &&
      this._t < 1 &&
      this._point === 2 &&
      this._context.lineTo(this._x, this._y),
      (this._line || (this._line !== 0 && this._point === 1)) &&
        this._context.closePath(),
      this._line >= 0 &&
        ((this._t = 1 - this._t), (this._line = 1 - this._line)));
  },
  point: function (t, n) {
    switch (((t = +t), (n = +n), this._point)) {
      case 0:
        ((this._point = 1),
          this._line ? this._context.lineTo(t, n) : this._context.moveTo(t, n));
        break;
      case 1:
        this._point = 2;
      default: {
        if (this._t <= 0)
          (this._context.lineTo(this._x, n), this._context.lineTo(t, n));
        else {
          var e = this._x * (1 - this._t) + t * this._t;
          (this._context.lineTo(e, this._y), this._context.lineTo(e, n));
        }
        break;
      }
    }
    ((this._x = t), (this._y = n));
  },
};
function S0(t) {
  return new he(t, 0.5);
}
function A0(t) {
  return new he(t, 0);
}
function $0(t) {
  return new he(t, 1);
}
const Cn = t => () => t;
function kf(t, { sourceEvent: n, target: e, transform: i, dispatch: r }) {
  Object.defineProperties(this, {
    type: { value: t, enumerable: !0, configurable: !0 },
    sourceEvent: { value: n, enumerable: !0, configurable: !0 },
    target: { value: e, enumerable: !0, configurable: !0 },
    transform: { value: i, enumerable: !0, configurable: !0 },
    _: { value: r },
  });
}
function bt(t, n, e) {
  ((this.k = t), (this.x = n), (this.y = e));
}
bt.prototype = {
  constructor: bt,
  scale: function (t) {
    return t === 1 ? this : new bt(this.k * t, this.x, this.y);
  },
  translate: function (t, n) {
    return (t === 0) & (n === 0)
      ? this
      : new bt(this.k, this.x + this.k * t, this.y + this.k * n);
  },
  apply: function (t) {
    return [t[0] * this.k + this.x, t[1] * this.k + this.y];
  },
  applyX: function (t) {
    return t * this.k + this.x;
  },
  applyY: function (t) {
    return t * this.k + this.y;
  },
  invert: function (t) {
    return [(t[0] - this.x) / this.k, (t[1] - this.y) / this.k];
  },
  invertX: function (t) {
    return (t - this.x) / this.k;
  },
  invertY: function (t) {
    return (t - this.y) / this.k;
  },
  rescaleX: function (t) {
    return t.copy().domain(t.range().map(this.invertX, this).map(t.invert, t));
  },
  rescaleY: function (t) {
    return t.copy().domain(t.range().map(this.invertY, this).map(t.invert, t));
  },
  toString: function () {
    return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
  },
};
var bo = new bt(1, 0, 0);
bt.prototype;
function Ne(t) {
  t.stopImmediatePropagation();
}
function un(t) {
  (t.preventDefault(), t.stopImmediatePropagation());
}
function Nf(t) {
  return (!t.ctrlKey || t.type === "wheel") && !t.button;
}
function Cf() {
  var t = this;
  return t instanceof SVGElement
    ? ((t = t.ownerSVGElement || t),
      t.hasAttribute("viewBox")
        ? ((t = t.viewBox.baseVal),
          [
            [t.x, t.y],
            [t.x + t.width, t.y + t.height],
          ])
        : [
            [0, 0],
            [t.width.baseVal.value, t.height.baseVal.value],
          ])
    : [
        [0, 0],
        [t.clientWidth, t.clientHeight],
      ];
}
function or() {
  return this.__zoom || bo;
}
function Sf(t) {
  return (
    -t.deltaY *
    (t.deltaMode === 1 ? 0.05 : t.deltaMode ? 1 : 0.002) *
    (t.ctrlKey ? 10 : 1)
  );
}
function Af() {
  return navigator.maxTouchPoints || "ontouchstart" in this;
}
function $f(t, n, e) {
  var i = t.invertX(n[0][0]) - e[0][0],
    r = t.invertX(n[1][0]) - e[1][0],
    o = t.invertY(n[0][1]) - e[0][1],
    s = t.invertY(n[1][1]) - e[1][1];
  return t.translate(
    r > i ? (i + r) / 2 : Math.min(0, i) || Math.max(0, r),
    s > o ? (o + s) / 2 : Math.min(0, o) || Math.max(0, s)
  );
}
function D0() {
  var t = Nf,
    n = Cf,
    e = $f,
    i = Sf,
    r = Af,
    o = [0, 1 / 0],
    s = [
      [-1 / 0, -1 / 0],
      [1 / 0, 1 / 0],
    ],
    u = 250,
    c = ca,
    a = dn("start", "zoom", "end"),
    h,
    _,
    l,
    f = 500,
    m = 150,
    v = 0,
    y = 10;
  function g(d) {
    d.property("__zoom", or)
      .on("wheel.zoom", L, { passive: !1 })
      .on("mousedown.zoom", I)
      .on("dblclick.zoom", R)
      .filter(r)
      .on("touchstart.zoom", D)
      .on("touchmove.zoom", P)
      .on("touchend.zoom touchcancel.zoom", E)
      .style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
  }
  ((g.transform = function (d, x, w, M) {
    var N = d.selection ? d.selection() : d;
    (N.property("__zoom", or),
      d !== N
        ? S(d, x, w, M)
        : N.interrupt().each(function () {
            T(this, arguments)
              .event(M)
              .start()
              .zoom(null, typeof x == "function" ? x.apply(this, arguments) : x)
              .end();
          }));
  }),
    (g.scaleBy = function (d, x, w, M) {
      g.scaleTo(
        d,
        function () {
          var N = this.__zoom.k,
            b = typeof x == "function" ? x.apply(this, arguments) : x;
          return N * b;
        },
        w,
        M
      );
    }),
    (g.scaleTo = function (d, x, w, M) {
      g.transform(
        d,
        function () {
          var N = n.apply(this, arguments),
            b = this.__zoom,
            $ =
              w == null
                ? p(N)
                : typeof w == "function"
                  ? w.apply(this, arguments)
                  : w,
            F = b.invert($),
            O = typeof x == "function" ? x.apply(this, arguments) : x;
          return e(C(k(b, O), $, F), N, s);
        },
        w,
        M
      );
    }),
    (g.translateBy = function (d, x, w, M) {
      g.transform(
        d,
        function () {
          return e(
            this.__zoom.translate(
              typeof x == "function" ? x.apply(this, arguments) : x,
              typeof w == "function" ? w.apply(this, arguments) : w
            ),
            n.apply(this, arguments),
            s
          );
        },
        null,
        M
      );
    }),
    (g.translateTo = function (d, x, w, M, N) {
      g.transform(
        d,
        function () {
          var b = n.apply(this, arguments),
            $ = this.__zoom,
            F =
              M == null
                ? p(b)
                : typeof M == "function"
                  ? M.apply(this, arguments)
                  : M;
          return e(
            bo
              .translate(F[0], F[1])
              .scale($.k)
              .translate(
                typeof x == "function" ? -x.apply(this, arguments) : -x,
                typeof w == "function" ? -w.apply(this, arguments) : -w
              ),
            b,
            s
          );
        },
        M,
        N
      );
    }));
  function k(d, x) {
    return (
      (x = Math.max(o[0], Math.min(o[1], x))),
      x === d.k ? d : new bt(x, d.x, d.y)
    );
  }
  function C(d, x, w) {
    var M = x[0] - w[0] * d.k,
      N = x[1] - w[1] * d.k;
    return M === d.x && N === d.y ? d : new bt(d.k, M, N);
  }
  function p(d) {
    return [(+d[0][0] + +d[1][0]) / 2, (+d[0][1] + +d[1][1]) / 2];
  }
  function S(d, x, w, M) {
    d.on("start.zoom", function () {
      T(this, arguments).event(M).start();
    })
      .on("interrupt.zoom end.zoom", function () {
        T(this, arguments).event(M).end();
      })
      .tween("zoom", function () {
        var N = this,
          b = arguments,
          $ = T(N, b).event(M),
          F = n.apply(N, b),
          O = w == null ? p(F) : typeof w == "function" ? w.apply(N, b) : w,
          W = Math.max(F[1][0] - F[0][0], F[1][1] - F[0][1]),
          q = N.__zoom,
          V = typeof x == "function" ? x.apply(N, b) : x,
          G = c(q.invert(O).concat(W / q.k), V.invert(O).concat(W / V.k));
        return function (Z) {
          if (Z === 1) Z = V;
          else {
            var et = G(Z),
              U = W / et[2];
            Z = new bt(U, O[0] - et[0] * U, O[1] - et[1] * U);
          }
          $.zoom(null, Z);
        };
      });
  }
  function T(d, x, w) {
    return (!w && d.__zooming) || new z(d, x);
  }
  function z(d, x) {
    ((this.that = d),
      (this.args = x),
      (this.active = 0),
      (this.sourceEvent = null),
      (this.extent = n.apply(d, x)),
      (this.taps = 0));
  }
  z.prototype = {
    event: function (d) {
      return (d && (this.sourceEvent = d), this);
    },
    start: function () {
      return (
        ++this.active === 1 &&
          ((this.that.__zooming = this), this.emit("start")),
        this
      );
    },
    zoom: function (d, x) {
      return (
        this.mouse &&
          d !== "mouse" &&
          (this.mouse[1] = x.invert(this.mouse[0])),
        this.touch0 &&
          d !== "touch" &&
          (this.touch0[1] = x.invert(this.touch0[0])),
        this.touch1 &&
          d !== "touch" &&
          (this.touch1[1] = x.invert(this.touch1[0])),
        (this.that.__zoom = x),
        this.emit("zoom"),
        this
      );
    },
    end: function () {
      return (
        --this.active === 0 && (delete this.that.__zooming, this.emit("end")),
        this
      );
    },
    emit: function (d) {
      var x = xt(this.that).datum();
      a.call(
        d,
        this.that,
        new kf(d, {
          sourceEvent: this.sourceEvent,
          target: g,
          transform: this.that.__zoom,
          dispatch: a,
        }),
        x
      );
    },
  };
  function L(d, ...x) {
    if (!t.apply(this, arguments)) return;
    var w = T(this, x).event(d),
      M = this.__zoom,
      N = Math.max(
        o[0],
        Math.min(o[1], M.k * Math.pow(2, i.apply(this, arguments)))
      ),
      b = yt(d);
    if (w.wheel)
      ((w.mouse[0][0] !== b[0] || w.mouse[0][1] !== b[1]) &&
        (w.mouse[1] = M.invert((w.mouse[0] = b))),
        clearTimeout(w.wheel));
    else {
      if (M.k === N) return;
      ((w.mouse = [b, M.invert(b)]), Un(this), w.start());
    }
    (un(d),
      (w.wheel = setTimeout($, m)),
      w.zoom("mouse", e(C(k(M, N), w.mouse[0], w.mouse[1]), w.extent, s)));
    function $() {
      ((w.wheel = null), w.end());
    }
  }
  function I(d, ...x) {
    if (l || !t.apply(this, arguments)) return;
    var w = d.currentTarget,
      M = T(this, x, !0).event(d),
      N = xt(d.view).on("mousemove.zoom", O, !0).on("mouseup.zoom", W, !0),
      b = yt(d, w),
      $ = d.clientX,
      F = d.clientY;
    (kr(d.view),
      Ne(d),
      (M.mouse = [b, this.__zoom.invert(b)]),
      Un(this),
      M.start());
    function O(q) {
      if ((un(q), !M.moved)) {
        var V = q.clientX - $,
          G = q.clientY - F;
        M.moved = V * V + G * G > v;
      }
      M.event(q).zoom(
        "mouse",
        e(C(M.that.__zoom, (M.mouse[0] = yt(q, w)), M.mouse[1]), M.extent, s)
      );
    }
    function W(q) {
      (N.on("mousemove.zoom mouseup.zoom", null),
        Nr(q.view, M.moved),
        un(q),
        M.event(q).end());
    }
  }
  function R(d, ...x) {
    if (t.apply(this, arguments)) {
      var w = this.__zoom,
        M = yt(d.changedTouches ? d.changedTouches[0] : d, this),
        N = w.invert(M),
        b = w.k * (d.shiftKey ? 0.5 : 2),
        $ = e(C(k(w, b), M, N), n.apply(this, x), s);
      (un(d),
        u > 0
          ? xt(this).transition().duration(u).call(S, $, M, d)
          : xt(this).call(g.transform, $, M, d));
    }
  }
  function D(d, ...x) {
    if (t.apply(this, arguments)) {
      var w = d.touches,
        M = w.length,
        N = T(this, x, d.changedTouches.length === M).event(d),
        b,
        $,
        F,
        O;
      for (Ne(d), $ = 0; $ < M; ++$)
        ((F = w[$]),
          (O = yt(F, this)),
          (O = [O, this.__zoom.invert(O), F.identifier]),
          N.touch0
            ? !N.touch1 &&
              N.touch0[2] !== O[2] &&
              ((N.touch1 = O), (N.taps = 0))
            : ((N.touch0 = O), (b = !0), (N.taps = 1 + !!h)));
      (h && (h = clearTimeout(h)),
        b &&
          (N.taps < 2 &&
            ((_ = O[0]),
            (h = setTimeout(function () {
              h = null;
            }, f))),
          Un(this),
          N.start()));
    }
  }
  function P(d, ...x) {
    if (this.__zooming) {
      var w = T(this, x).event(d),
        M = d.changedTouches,
        N = M.length,
        b,
        $,
        F,
        O;
      for (un(d), b = 0; b < N; ++b)
        (($ = M[b]),
          (F = yt($, this)),
          w.touch0 && w.touch0[2] === $.identifier
            ? (w.touch0[0] = F)
            : w.touch1 && w.touch1[2] === $.identifier && (w.touch1[0] = F));
      if ((($ = w.that.__zoom), w.touch1)) {
        var W = w.touch0[0],
          q = w.touch0[1],
          V = w.touch1[0],
          G = w.touch1[1],
          Z = (Z = V[0] - W[0]) * Z + (Z = V[1] - W[1]) * Z,
          et = (et = G[0] - q[0]) * et + (et = G[1] - q[1]) * et;
        (($ = k($, Math.sqrt(Z / et))),
          (F = [(W[0] + V[0]) / 2, (W[1] + V[1]) / 2]),
          (O = [(q[0] + G[0]) / 2, (q[1] + G[1]) / 2]));
      } else if (w.touch0) ((F = w.touch0[0]), (O = w.touch0[1]));
      else return;
      w.zoom("touch", e(C($, F, O), w.extent, s));
    }
  }
  function E(d, ...x) {
    if (this.__zooming) {
      var w = T(this, x).event(d),
        M = d.changedTouches,
        N = M.length,
        b,
        $;
      for (
        Ne(d),
          l && clearTimeout(l),
          l = setTimeout(function () {
            l = null;
          }, f),
          b = 0;
        b < N;
        ++b
      )
        (($ = M[b]),
          w.touch0 && w.touch0[2] === $.identifier
            ? delete w.touch0
            : w.touch1 && w.touch1[2] === $.identifier && delete w.touch1);
      if (
        (w.touch1 && !w.touch0 && ((w.touch0 = w.touch1), delete w.touch1),
        w.touch0)
      )
        w.touch0[1] = this.__zoom.invert(w.touch0[0]);
      else if (
        (w.end(),
        w.taps === 2 &&
          (($ = yt($, this)), Math.hypot(_[0] - $[0], _[1] - $[1]) < y))
      ) {
        var F = xt(this).on("dblclick.zoom");
        F && F.apply(this, arguments);
      }
    }
  }
  return (
    (g.wheelDelta = function (d) {
      return arguments.length
        ? ((i = typeof d == "function" ? d : Cn(+d)), g)
        : i;
    }),
    (g.filter = function (d) {
      return arguments.length
        ? ((t = typeof d == "function" ? d : Cn(!!d)), g)
        : t;
    }),
    (g.touchable = function (d) {
      return arguments.length
        ? ((r = typeof d == "function" ? d : Cn(!!d)), g)
        : r;
    }),
    (g.extent = function (d) {
      return arguments.length
        ? ((n =
            typeof d == "function"
              ? d
              : Cn([
                  [+d[0][0], +d[0][1]],
                  [+d[1][0], +d[1][1]],
                ])),
          g)
        : n;
    }),
    (g.scaleExtent = function (d) {
      return arguments.length
        ? ((o[0] = +d[0]), (o[1] = +d[1]), g)
        : [o[0], o[1]];
    }),
    (g.translateExtent = function (d) {
      return arguments.length
        ? ((s[0][0] = +d[0][0]),
          (s[1][0] = +d[1][0]),
          (s[0][1] = +d[0][1]),
          (s[1][1] = +d[1][1]),
          g)
        : [
            [s[0][0], s[0][1]],
            [s[1][0], s[1][1]],
          ];
    }),
    (g.constrain = function (d) {
      return arguments.length ? ((e = d), g) : e;
    }),
    (g.duration = function (d) {
      return arguments.length ? ((u = +d), g) : u;
    }),
    (g.interpolate = function (d) {
      return arguments.length ? ((c = d), g) : c;
    }),
    (g.on = function () {
      var d = a.on.apply(a, arguments);
      return d === a ? g : d;
    }),
    (g.clickDistance = function (d) {
      return arguments.length ? ((v = (d = +d) * d), g) : Math.sqrt(v);
    }),
    (g.tapDistance = function (d) {
      return arguments.length ? ((y = +d), g) : y;
    }),
    g
  );
}
function sr(t, n) {
  let e;
  if (n === void 0)
    for (const i of t)
      i != null && (e < i || (e === void 0 && i >= i)) && (e = i);
  else {
    let i = -1;
    for (let r of t)
      (r = n(r, ++i, t)) != null &&
        (e < r || (e === void 0 && r >= r)) &&
        (e = r);
  }
  return e;
}
function To(t, n) {
  let e;
  if (n === void 0)
    for (const i of t)
      i != null && (e > i || (e === void 0 && i >= i)) && (e = i);
  else {
    let i = -1;
    for (let r of t)
      (r = n(r, ++i, t)) != null &&
        (e > r || (e === void 0 && r >= r)) &&
        (e = r);
  }
  return e;
}
function Ce(t, n) {
  let e = 0;
  if (n === void 0) for (let i of t) (i = +i) && (e += i);
  else {
    let i = -1;
    for (let r of t) (r = +n(r, ++i, t)) && (e += r);
  }
  return e;
}
function Df(t) {
  return t.target.depth;
}
function E0(t) {
  return t.depth;
}
function z0(t, n) {
  return n - 1 - t.height;
}
function Ef(t, n) {
  return t.sourceLinks.length ? t.depth : n - 1;
}
function U0(t) {
  return t.targetLinks.length
    ? t.depth
    : t.sourceLinks.length
      ? To(t.sourceLinks, Df) - 1
      : 0;
}
function Sn(t) {
  return function () {
    return t;
  };
}
function ur(t, n) {
  return ne(t.source, n.source) || t.index - n.index;
}
function ar(t, n) {
  return ne(t.target, n.target) || t.index - n.index;
}
function ne(t, n) {
  return t.y0 - n.y0;
}
function Se(t) {
  return t.value;
}
function zf(t) {
  return t.index;
}
function Uf(t) {
  return t.nodes;
}
function Lf(t) {
  return t.links;
}
function cr(t, n) {
  const e = t.get(n);
  if (!e) throw new Error("missing: " + n);
  return e;
}
function hr({ nodes: t }) {
  for (const n of t) {
    let e = n.y0,
      i = e;
    for (const r of n.sourceLinks) ((r.y0 = e + r.width / 2), (e += r.width));
    for (const r of n.targetLinks) ((r.y1 = i + r.width / 2), (i += r.width));
  }
}
function L0() {
  let t = 0,
    n = 0,
    e = 1,
    i = 1,
    r = 24,
    o = 8,
    s,
    u = zf,
    c = Ef,
    a,
    h,
    _ = Uf,
    l = Lf,
    f = 6;
  function m() {
    const x = {
      nodes: _.apply(null, arguments),
      links: l.apply(null, arguments),
    };
    return (v(x), y(x), g(x), k(x), S(x), hr(x), x);
  }
  ((m.update = function (x) {
    return (hr(x), x);
  }),
    (m.nodeId = function (x) {
      return arguments.length
        ? ((u = typeof x == "function" ? x : Sn(x)), m)
        : u;
    }),
    (m.nodeAlign = function (x) {
      return arguments.length
        ? ((c = typeof x == "function" ? x : Sn(x)), m)
        : c;
    }),
    (m.nodeSort = function (x) {
      return arguments.length ? ((a = x), m) : a;
    }),
    (m.nodeWidth = function (x) {
      return arguments.length ? ((r = +x), m) : r;
    }),
    (m.nodePadding = function (x) {
      return arguments.length ? ((o = s = +x), m) : o;
    }),
    (m.nodes = function (x) {
      return arguments.length
        ? ((_ = typeof x == "function" ? x : Sn(x)), m)
        : _;
    }),
    (m.links = function (x) {
      return arguments.length
        ? ((l = typeof x == "function" ? x : Sn(x)), m)
        : l;
    }),
    (m.linkSort = function (x) {
      return arguments.length ? ((h = x), m) : h;
    }),
    (m.size = function (x) {
      return arguments.length
        ? ((t = n = 0), (e = +x[0]), (i = +x[1]), m)
        : [e - t, i - n];
    }),
    (m.extent = function (x) {
      return arguments.length
        ? ((t = +x[0][0]), (e = +x[1][0]), (n = +x[0][1]), (i = +x[1][1]), m)
        : [
            [t, n],
            [e, i],
          ];
    }),
    (m.iterations = function (x) {
      return arguments.length ? ((f = +x), m) : f;
    }));
  function v({ nodes: x, links: w }) {
    for (const [N, b] of x.entries())
      ((b.index = N), (b.sourceLinks = []), (b.targetLinks = []));
    const M = new Map(x.map((N, b) => [u(N, b, x), N]));
    for (const [N, b] of w.entries()) {
      b.index = N;
      let { source: $, target: F } = b;
      (typeof $ != "object" && ($ = b.source = cr(M, $)),
        typeof F != "object" && (F = b.target = cr(M, F)),
        $.sourceLinks.push(b),
        F.targetLinks.push(b));
    }
    if (h != null)
      for (const { sourceLinks: N, targetLinks: b } of x)
        (N.sort(h), b.sort(h));
  }
  function y({ nodes: x }) {
    for (const w of x)
      w.value =
        w.fixedValue === void 0
          ? Math.max(Ce(w.sourceLinks, Se), Ce(w.targetLinks, Se))
          : w.fixedValue;
  }
  function g({ nodes: x }) {
    const w = x.length;
    let M = new Set(x),
      N = new Set(),
      b = 0;
    for (; M.size; ) {
      for (const $ of M) {
        $.depth = b;
        for (const { target: F } of $.sourceLinks) N.add(F);
      }
      if (++b > w) throw new Error("circular link");
      ((M = N), (N = new Set()));
    }
  }
  function k({ nodes: x }) {
    const w = x.length;
    let M = new Set(x),
      N = new Set(),
      b = 0;
    for (; M.size; ) {
      for (const $ of M) {
        $.height = b;
        for (const { source: F } of $.targetLinks) N.add(F);
      }
      if (++b > w) throw new Error("circular link");
      ((M = N), (N = new Set()));
    }
  }
  function C({ nodes: x }) {
    const w = sr(x, b => b.depth) + 1,
      M = (e - t - r) / (w - 1),
      N = new Array(w);
    for (const b of x) {
      const $ = Math.max(0, Math.min(w - 1, Math.floor(c.call(null, b, w))));
      ((b.layer = $),
        (b.x0 = t + $ * M),
        (b.x1 = b.x0 + r),
        N[$] ? N[$].push(b) : (N[$] = [b]));
    }
    if (a) for (const b of N) b.sort(a);
    return N;
  }
  function p(x) {
    const w = To(x, M => (i - n - (M.length - 1) * s) / Ce(M, Se));
    for (const M of x) {
      let N = n;
      for (const b of M) {
        ((b.y0 = N), (b.y1 = N + b.value * w), (N = b.y1 + s));
        for (const $ of b.sourceLinks) $.width = $.value * w;
      }
      N = (i - N + s) / (M.length + 1);
      for (let b = 0; b < M.length; ++b) {
        const $ = M[b];
        (($.y0 += N * (b + 1)), ($.y1 += N * (b + 1)));
      }
      P(M);
    }
  }
  function S(x) {
    const w = C(x);
    ((s = Math.min(o, (i - n) / (sr(w, M => M.length) - 1))), p(w));
    for (let M = 0; M < f; ++M) {
      const N = Math.pow(0.99, M),
        b = Math.max(1 - N, (M + 1) / f);
      (z(w, N, b), T(w, N, b));
    }
  }
  function T(x, w, M) {
    for (let N = 1, b = x.length; N < b; ++N) {
      const $ = x[N];
      for (const F of $) {
        let O = 0,
          W = 0;
        for (const { source: V, value: G } of F.targetLinks) {
          let Z = G * (F.layer - V.layer);
          ((O += E(V, F) * Z), (W += Z));
        }
        if (!(W > 0)) continue;
        let q = (O / W - F.y0) * w;
        ((F.y0 += q), (F.y1 += q), D(F));
      }
      (a === void 0 && $.sort(ne), L($, M));
    }
  }
  function z(x, w, M) {
    for (let N = x.length, b = N - 2; b >= 0; --b) {
      const $ = x[b];
      for (const F of $) {
        let O = 0,
          W = 0;
        for (const { target: V, value: G } of F.sourceLinks) {
          let Z = G * (V.layer - F.layer);
          ((O += d(F, V) * Z), (W += Z));
        }
        if (!(W > 0)) continue;
        let q = (O / W - F.y0) * w;
        ((F.y0 += q), (F.y1 += q), D(F));
      }
      (a === void 0 && $.sort(ne), L($, M));
    }
  }
  function L(x, w) {
    const M = x.length >> 1,
      N = x[M];
    (R(x, N.y0 - s, M - 1, w),
      I(x, N.y1 + s, M + 1, w),
      R(x, i, x.length - 1, w),
      I(x, n, 0, w));
  }
  function I(x, w, M, N) {
    for (; M < x.length; ++M) {
      const b = x[M],
        $ = (w - b.y0) * N;
      ($ > 1e-6 && ((b.y0 += $), (b.y1 += $)), (w = b.y1 + s));
    }
  }
  function R(x, w, M, N) {
    for (; M >= 0; --M) {
      const b = x[M],
        $ = (b.y1 - w) * N;
      ($ > 1e-6 && ((b.y0 -= $), (b.y1 -= $)), (w = b.y0 - s));
    }
  }
  function D({ sourceLinks: x, targetLinks: w }) {
    if (h === void 0) {
      for (const {
        source: { sourceLinks: M },
      } of w)
        M.sort(ar);
      for (const {
        target: { targetLinks: M },
      } of x)
        M.sort(ur);
    }
  }
  function P(x) {
    if (h === void 0)
      for (const { sourceLinks: w, targetLinks: M } of x)
        (w.sort(ar), M.sort(ur));
  }
  function E(x, w) {
    let M = x.y0 - ((x.sourceLinks.length - 1) * s) / 2;
    for (const { target: N, width: b } of x.sourceLinks) {
      if (N === w) break;
      M += b + s;
    }
    for (const { source: N, width: b } of w.targetLinks) {
      if (N === x) break;
      M -= b;
    }
    return M;
  }
  function d(x, w) {
    let M = w.y0 - ((w.targetLinks.length - 1) * s) / 2;
    for (const { source: N, width: b } of w.targetLinks) {
      if (N === x) break;
      M += b + s;
    }
    for (const { target: N, width: b } of x.sourceLinks) {
      if (N === w) break;
      M -= b;
    }
    return M;
  }
  return m;
}
var qe = Math.PI,
  Ve = 2 * qe,
  Et = 1e-6,
  Ff = Ve - Et;
function Xe() {
  ((this._x0 = this._y0 = this._x1 = this._y1 = null), (this._ = ""));
}
function ko() {
  return new Xe();
}
Xe.prototype = ko.prototype = {
  constructor: Xe,
  moveTo: function (t, n) {
    this._ +=
      "M" + (this._x0 = this._x1 = +t) + "," + (this._y0 = this._y1 = +n);
  },
  closePath: function () {
    this._x1 !== null &&
      ((this._x1 = this._x0), (this._y1 = this._y0), (this._ += "Z"));
  },
  lineTo: function (t, n) {
    this._ += "L" + (this._x1 = +t) + "," + (this._y1 = +n);
  },
  quadraticCurveTo: function (t, n, e, i) {
    this._ +=
      "Q" + +t + "," + +n + "," + (this._x1 = +e) + "," + (this._y1 = +i);
  },
  bezierCurveTo: function (t, n, e, i, r, o) {
    this._ +=
      "C" +
      +t +
      "," +
      +n +
      "," +
      +e +
      "," +
      +i +
      "," +
      (this._x1 = +r) +
      "," +
      (this._y1 = +o);
  },
  arcTo: function (t, n, e, i, r) {
    ((t = +t), (n = +n), (e = +e), (i = +i), (r = +r));
    var o = this._x1,
      s = this._y1,
      u = e - t,
      c = i - n,
      a = o - t,
      h = s - n,
      _ = a * a + h * h;
    if (r < 0) throw new Error("negative radius: " + r);
    if (this._x1 === null)
      this._ += "M" + (this._x1 = t) + "," + (this._y1 = n);
    else if (_ > Et)
      if (!(Math.abs(h * u - c * a) > Et) || !r)
        this._ += "L" + (this._x1 = t) + "," + (this._y1 = n);
      else {
        var l = e - o,
          f = i - s,
          m = u * u + c * c,
          v = l * l + f * f,
          y = Math.sqrt(m),
          g = Math.sqrt(_),
          k = r * Math.tan((qe - Math.acos((m + _ - v) / (2 * y * g))) / 2),
          C = k / g,
          p = k / y;
        (Math.abs(C - 1) > Et &&
          (this._ += "L" + (t + C * a) + "," + (n + C * h)),
          (this._ +=
            "A" +
            r +
            "," +
            r +
            ",0,0," +
            +(h * l > a * f) +
            "," +
            (this._x1 = t + p * u) +
            "," +
            (this._y1 = n + p * c)));
      }
  },
  arc: function (t, n, e, i, r, o) {
    ((t = +t), (n = +n), (e = +e), (o = !!o));
    var s = e * Math.cos(i),
      u = e * Math.sin(i),
      c = t + s,
      a = n + u,
      h = 1 ^ o,
      _ = o ? i - r : r - i;
    if (e < 0) throw new Error("negative radius: " + e);
    (this._x1 === null
      ? (this._ += "M" + c + "," + a)
      : (Math.abs(this._x1 - c) > Et || Math.abs(this._y1 - a) > Et) &&
        (this._ += "L" + c + "," + a),
      e &&
        (_ < 0 && (_ = (_ % Ve) + Ve),
        _ > Ff
          ? (this._ +=
              "A" +
              e +
              "," +
              e +
              ",0,1," +
              h +
              "," +
              (t - s) +
              "," +
              (n - u) +
              "A" +
              e +
              "," +
              e +
              ",0,1," +
              h +
              "," +
              (this._x1 = c) +
              "," +
              (this._y1 = a))
          : _ > Et &&
            (this._ +=
              "A" +
              e +
              "," +
              e +
              ",0," +
              +(_ >= qe) +
              "," +
              h +
              "," +
              (this._x1 = t + e * Math.cos(r)) +
              "," +
              (this._y1 = n + e * Math.sin(r)))));
  },
  rect: function (t, n, e, i) {
    this._ +=
      "M" +
      (this._x0 = this._x1 = +t) +
      "," +
      (this._y0 = this._y1 = +n) +
      "h" +
      +e +
      "v" +
      +i +
      "h" +
      -e +
      "Z";
  },
  toString: function () {
    return this._;
  },
};
function lr(t) {
  return function () {
    return t;
  };
}
function Rf(t) {
  return t[0];
}
function Pf(t) {
  return t[1];
}
var If = Array.prototype.slice;
function Yf(t) {
  return t.source;
}
function Hf(t) {
  return t.target;
}
function Of(t) {
  var n = Yf,
    e = Hf,
    i = Rf,
    r = Pf,
    o = null;
  function s() {
    var u,
      c = If.call(arguments),
      a = n.apply(this, c),
      h = e.apply(this, c);
    if (
      (o || (o = u = ko()),
      t(
        o,
        +i.apply(this, ((c[0] = a), c)),
        +r.apply(this, c),
        +i.apply(this, ((c[0] = h), c)),
        +r.apply(this, c)
      ),
      u)
    )
      return ((o = null), u + "" || null);
  }
  return (
    (s.source = function (u) {
      return arguments.length ? ((n = u), s) : n;
    }),
    (s.target = function (u) {
      return arguments.length ? ((e = u), s) : e;
    }),
    (s.x = function (u) {
      return arguments.length
        ? ((i = typeof u == "function" ? u : lr(+u)), s)
        : i;
    }),
    (s.y = function (u) {
      return arguments.length
        ? ((r = typeof u == "function" ? u : lr(+u)), s)
        : r;
    }),
    (s.context = function (u) {
      return arguments.length ? ((o = u ?? null), s) : o;
    }),
    s
  );
}
function Bf(t, n, e, i, r) {
  (t.moveTo(n, e), t.bezierCurveTo((n = (n + i) / 2), e, n, r, i, r));
}
function qf() {
  return Of(Bf);
}
function Vf(t) {
  return [t.source.x1, t.y0];
}
function Xf(t) {
  return [t.target.x0, t.y1];
}
function F0() {
  return qf().source(Vf).target(Xf);
}
export {
  F0 as $,
  jf as A,
  Kf as B,
  so as C,
  ai as D,
  ae as E,
  Jh as F,
  Kh as G,
  Jt as H,
  Gh as I,
  Qh as J,
  Qn as K,
  xn as L,
  si as M,
  oi as N,
  qt as O,
  Zn as P,
  Gf as Q,
  c0 as R,
  Jr as S,
  l0 as T,
  Lh as U,
  L0 as V,
  Ef as W,
  U0 as X,
  z0 as Y,
  E0 as Z,
  a0 as _,
  A0 as a,
  Qr as a0,
  Kr as a1,
  s0 as a2,
  D0 as a3,
  r0 as a4,
  i0 as a5,
  o0 as a6,
  n0 as a7,
  e0 as a8,
  Jf as a9,
  bo as aa,
  $0 as b,
  S0 as c,
  C0 as d,
  k0 as e,
  T0 as f,
  vf as g,
  w0 as h,
  b0 as i,
  M0 as j,
  y0 as k,
  v0 as l,
  N0 as m,
  x0 as n,
  m0 as o,
  _0 as p,
  f0 as q,
  d0 as r,
  xt as s,
  p0 as t,
  g0 as u,
  h0 as v,
  u0 as w,
  Qf as x,
  Zf as y,
  qh as z,
};
