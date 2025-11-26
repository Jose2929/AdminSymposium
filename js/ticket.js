const URL = "https://script.google.com/macros/s/AKfycbzvoeRYJ1xtLTf_MAHedlkJZfGNScB5XDTl3CFAY2VPTJcUvsHhRpuHH_XE9IgByBA-/exec"; // <-- pega la URL

function enviar() {
  const d1 = document.getElementById("v1").value;
  const d2 = document.getElementById("v2").value;
  const d3 = document.getElementById("v3").value;

  fetch(`${URL}?action=write&d1=${encodeURIComponent(d1)}&d2=${encodeURIComponent(d2)}&d3=${encodeURIComponent(d3)}`)
    .then(r => r.text())
    .then(t => alert("Resultado: " + t));
}

function leer() {
  fetch(`${URL}?action=read`)
    .then(r => r.json())
    .then(data => {
        console.log(JSON.stringify(data, null, 2));
    });
}

leer();