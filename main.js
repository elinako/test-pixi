const app = new PIXI.Application({
  width: 960,
  height: 536,
  backgroundColor: 0x10999bb,
});

document.body.appendChild(app.view);

PIXI.Loader.shared
  .add([
    "images/BG.png",
    "images/BTN_Spin.png",
    "images/SYM1.png",
    "images/SYM3.png",
    "images/SYM4.png",
    "images/SYM5.png",
    "images/SYM6.png",
    "images/SYM7.png",
  ])
  .load(setup);

const reelWidth = 235;
const elementSize = 200;

const background = PIXI.Sprite.from("images/BG.png");
app.stage.addChild(background);

function setup() {
  const slotTextures = [
    PIXI.Texture.from("images/SYM1.png"),
    PIXI.Texture.from("images/SYM3.png"),
    PIXI.Texture.from("images/SYM4.png"),
    PIXI.Texture.from("images/SYM5.png"),
    PIXI.Texture.from("images/SYM6.png"),
    PIXI.Texture.from("images/SYM7.png"),
  ];

  const reels = [];
  const reelContainer = new PIXI.Container();

  for (let i = 0; i < 3; i++) {
    const rc = new PIXI.Container();
    rc.x = i * reelWidth;
    reelContainer.addChild(rc);

    const reel = {
      container: rc,
      symbols: [],
      position: 0,
      previousPosition: 0,
      blur: new PIXI.filters.BlurFilter(),
    };
    reel.blur.blurX = 0;
    reel.blur.blurY = 0;
    rc.filters = [reel.blur];

    for (let j = 0; j < 6; j++) {
      const symbol = new PIXI.Sprite(
        slotTextures[Math.floor(Math.random() * slotTextures.length)]
      );
      symbol.y = j * elementSize;
      symbol.scale.x = symbol.scale.y = Math.min(
        elementSize / symbol.width,
        elementSize / symbol.height
      );
      symbol.x = Math.round(elementSize - symbol.width / 2);
      reel.symbols.push(symbol);
      rc.addChild(symbol);
    }

    reels.push(reel);
  }

  const textureButton = PIXI.Texture.from("images/BTN_Spin.png");
  const textureButtonOver = PIXI.Texture.from("images/BTN_Spin_d.png");
  const button = new PIXI.Sprite(textureButton);
  button.x = 824;
  button.y = 218;
  button.interactive = true;
  button.buttonMode = true;
  app.stage.addChild(button);
  app.stage.addChild(reelContainer);

  button.on("pointerdown", onClick);

  function onClick() {
    if (running) return;
    running = true;
    this.texture = textureButtonOver;
    for (let i = 0; i < reels.length; i++) {
      const r = reels[i];
      const extra = Math.floor(Math.random() * 3);
      const target = r.position + 10 + i * 3 + extra;
      const time = 2500 + i * 600 + extra * 600;
      tweenTo(
        r,
        "position",
        target,
        time,
        backout(0.5),
        null,
        i === reels.length - 1 ? reelsComplete : null
      );
    }
  }

  let running = false;

  function reelsComplete() {
    running = false;
  }

  app.ticker.add((delta) => {
    for (let i = 0; i < reels.length; i++) {
      const r = reels[i];
      r.blur.blurY = (r.position - r.previousPosition) * 8;
      r.previousPosition = r.position;

      for (let j = 0; j < r.symbols.length; j++) {
        const s = r.symbols[j];
        const prevy = s.y;
        s.y = ((r.position + j) % r.symbols.length) * elementSize - elementSize;
        if (s.y < 0 && prevy > elementSize) {
          s.texture =
            slotTextures[Math.floor(Math.random() * slotTextures.length)];
          s.scale.x = s.scale.y = Math.min(
            elementSize / s.texture.width,
            elementSize / s.texture.height
          );
          s.x = Math.round(elementSize - s.width / 2);
        }
      }
    }
  });
}

const tweening = [];
function tweenTo(object, property, target, time, easing, onchange, oncomplete) {
  const tween = {
    object,
    property,
    propertyBeginValue: object[property],
    target,
    easing,
    time,
    change: onchange,
    complete: oncomplete,
    start: Date.now(),
  };

  tweening.push(tween);
  return tween;
}

app.ticker.add((delta) => {
  const now = Date.now();
  const remove = [];
  for (let i = 0; i < tweening.length; i++) {
    const t = tweening[i];
    const phase = Math.min(1, (now - t.start) / t.time);

    t.object[t.property] = lerp(
      t.propertyBeginValue,
      t.target,
      t.easing(phase)
    );
    if (t.change) t.change(t);
    if (phase === 1) {
      t.object[t.property] = t.target;
      if (t.complete) t.complete(t);
      remove.push(t);
    }
  }
  for (let i = 0; i < remove.length; i++) {
    tweening.splice(tweening.indexOf(remove[i]), 1);
  }
});

function lerp(a1, a2, t) {
  return a1 * (1 - t) + a2 * t;
}

function backout(amount) {
  return (t) => --t * t * ((amount + 1) * t + amount) + 1;
}
