(function(){
  var src = document.getElementById("app-source").textContent;
  var out = Babel.transform(src, { presets: [["react", { runtime: "classic" }]] }).code;
  var s = document.createElement("script");
  s.textContent = out;
  document.body.appendChild(s);
})();
