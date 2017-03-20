var script;
if (typeof document != "undefined") {
  script = document.createElement("script");
  script.src = "cc.host/host.js";
  try { document.body.appendChild(script); } catch(e) { console.error(e); }
  script = document.createElement("script");
  script.src = "cc.type/type.js";
  try { document.body.appendChild(script); } catch(e) { console.error(e); }
  script = document.createElement("script");
  script.src = "cc.validate/validate.js";
  try { document.body.appendChild(script); } catch(e) { console.error(e); }
  script = document.createElement("script");
  script.src = "cc.string/string.js";
  try { document.body.appendChild(script); } catch(e) { console.error(e); }
  script = document.createElement("script");
  script.src = "cc.event/event.js";
  try { document.body.appendChild(script); } catch(e) { console.error(e); }
  script = document.createElement("script");
  script.src = "cc.io/io.js";
  try { document.body.appendChild(script); } catch(e) { console.error(e); }
  script = document.createElement("script");
  script.src = "cc.io.format.tar/tar.js";
  try { document.body.appendChild(script); } catch(e) { console.error(e); }
  script = document.createElement("script");
  script.src = "cc.log/log.js";
  try { document.body.appendChild(script); } catch(e) { console.error(e); }
  script = document.createElement("script");
  script.src = "cc.object/object.js";
  try { document.body.appendChild(script); } catch(e) { console.error(e); }
  script = document.createElement("script");
  script.src = "cc.boolean/boolean.js";
  try { document.body.appendChild(script); } catch(e) { console.error(e); }
  script = document.createElement("script");
  script.src = "cc.array/array.js";
  try { document.body.appendChild(script); } catch(e) { console.error(e); }
  script = document.createElement("script");
  script.src = "cc.pkx/pkx.js";
  try { document.body.appendChild(script); } catch(e) { console.error(e); }
  script = document.createElement("script");
  script.src = "cc.io.http/http.js";
  try { document.body.appendChild(script); } catch(e) { console.error(e); }
  script = document.createElement("script");
  script.src = "cc.io.file-system/file-system.js";
  try { document.body.appendChild(script); } catch(e) { console.error(e); }
}
else if (typeof require === "function") {
  require("./cc.host/host.js");
  require("./cc.type/type.js");
  require("./cc.validate/validate.js");
  require("./cc.string/string.js");
  require("./cc.event/event.js");
  require("./cc.io/io.js");
  require("./cc.io.format.tar/tar.js");
  require("./cc.log/log.js");
  require("./cc.object/object.js");
  require("./cc.boolean/boolean.js");
  require("./cc.array/array.js");
  require("./cc.pkx/pkx.js");
  require("./cc.io.http/http.js");
  require("./cc.io.file-system/file-system.js");
}
