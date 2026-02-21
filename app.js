document.addEventListener("DOMContentLoaded", function () {

  const startBtn = document.getElementById("start-btn");
  const splash = document.getElementById("splash");
  const ad = document.getElementById("ad");

  const skipAdBtn = document.getElementById("skip-ad");
  const round = document.getElementById("round");

  startBtn.addEventListener("click", function () {

    splash.classList.add("hidden");
    startBtn.classList.add("hidden");
    ad.classList.remove("hidden");

    skipAdBtn.disabled = true;

    setTimeout(function () {
      skipAdBtn.disabled = false;
    }, 2000);

  });

  skipAdBtn.addEventListener("click", function () {
    ad.classList.add("hidden");
    round.classList.remove("hidden");
  });

});
