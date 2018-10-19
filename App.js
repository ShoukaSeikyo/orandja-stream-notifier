const App = (function() {

  const WebQuery = class {
    constructor() {
      this.data = {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        redirect: 'follow',
        referrer: 'client',
        body: '{}'
      };

      this.emptyResponse = false;
      this.url = () => '';
    }

    setEmptyResponse(value = false) {
      this.emptyResponse = value;
      return this;
    }

    setData(value) {
      Object.assign(this.data, value);
      return this;
    }

    setURL(method) {
      (typeof method === 'function') && (this.url = method);
      return this;
    }

    fetch(obj) {
      return fetch(this.url(obj), this.data)
      .catch(err => console.log(this.url, err));
    }

    json(obj) {
      return this.fetch(obj)
      .then(async r => {
        if(r.ok) {
          return await r.json();
        }

        return this.emptyResponse;
      })
    }
  };

  const Chunks = function(array, size = 100) {
    if(array.length < 1) {
      return array;
    }
    if(array.length < size) {
      return [array];
    }

    const queryN = Math.ceil(array.length / size);
    const queryCount = Math.floor(array.length / queryN);
    const rest = array.length - (queryCount * queryN);

    const chunks = [];
    for(let i = 0; i < queryN; i++) {
      const chunk = [];
      array.slice(i * queryCount, (i + 1) * queryCount).forEach((e, i) => {
        chunk.push(e);
      });
      chunks.push(chunk);
    }

    const lastEntries = array.slice(queryN * queryCount, array.length - rest);
    for(let i = 0; i < rest; i++) {
      chunks[i].push(lastEntries[i]);
    }

    return chunks;
  };

  const Wait = new (class {
    constructor() {
      this.promises = {};
    }

    for(name, delay = 500) {
      if(typeof name !== 'string' || name.length < 1) {
        throw new Error(`[Wait]: Not waiting for a string.`);
      }

      let resolve;

      if(!this.has(name)) {
        this.promises[name] = new Promise(waiting => resolve = waiting);

        return new Promise(async wait => setTimeout(async () => {
          delete this.promises[name];
          wait(resolve);
        }, delay));
      }

      return this.get(name);
    }

    has(name) {
      return this.promises.hasOwnProperty(name);
    }

    get(name) {
      return this.has(name) && this.promises[name];
    }

  })();

  const Throttle = new (class {
    constructor() {
      this.throttles = {};

      this.empty = { then: function() {} }
    }

    last(name, time = 100) {
      let throttle;
      if(this.has(name)) {
        throttle = this.throttles[name];
        clearTimeout(throttle.timeout);
        try {
          throttle.reject();
        } catch(e) {}
      } else {
        throttle = this.throttles[name] = {};
      }

      return throttle.promise = new Promise((resolve, reject) => {
        throttle.reject = reject;
        throttle.timeout = setTimeout(() => {
          resolve();
          delete this.throttles[name];
        }, time);
      });
    }

    first(name, time = 100) {
      if(this.has(name)) {
        // HAAAAAAACCCCCCKSSSSSS !!!
        return this.empty;
      }

      let throttle = this.throttles[name] = {};

      return throttle.promise = new Promise(resolve => {
        throttle.timeout = setTimeout(() => {
          resolve();
          delete this.throttles[name];
        }, time);
      });
    }

    has(name) {
      return this.throttles.hasOwnProperty(name);
    }

    clear(name = null) {
      if(name === null) {
        for(name in this.throttles) {
          this.clear(name);
        }
        return;
      }

      return this.has(name) && clearTimeout(this.throttles[name].timeout), (delete this.throttles[name]);
    }
  })();

  const CustomOperators = {
    LazyLoader: new (class {
      constructor() {
        this.appImportRegex = /#([a-zA-Z0-9-_, ]+);/g;
        this.appTempRegex = /#([a-zA-Z0-9-_]+)\?/g;
        this.appGetRegex = /([a-zA-Z0-9-_]+)/g;
      }

      _apply(input) {
        let appImport;

        while((appImport = this.appTempRegex.exec(input)) !== null) {
          input = input.replace(appImport[0], `(await App.get('${appImport[1]}'))`);
        }

        while((appImport = this.appImportRegex.exec(input)) !== null) {
          let constNames = appImport[1],
              importNames = appImport[1];

          if(appImport[1].indexOf(',') > -1) {
            constNames = appImport[1].split(/ ?, ?/gm).map(name => name.indexOf(' as ') > -1 ? name.split(' as ')[1] : name).join(', ');
            importNames = appImport[1].split(/ ?, ?/gm).map(name => name.indexOf(' as ') > -1 ? name.split(' as ')[0] : name).join(', ');
            // appImport[1].split(/ ?, ?/gm)
            input = input.replace(appImport[0], `const [${constNames}] = await App.get(${importNames.replace(this.appGetRegex, `'$1'`)});`);
          } else {
            if(appImport[1].indexOf(' as ') > -1) {
              constNames = appImport[1].split(' as ')[1];
              importNames = appImport[1].split(' as ')[0];
            }
            input = input.replace(appImport[0], `const ${constNames} = await App.get('${importNames}');`);
          }
        }

        return input;
      }
    })(),
    Log: new (class {
      constructor() {
        this.toLog = /Θ(.+);/g;
      }

      _apply(input) {
        let logLine;
        while((logLine = this.toLog.exec(input)) !== null) {
          input = input.replace(logLine[0], `console.log(${logLine[1]});`);
        }

        return input;
      }
    })()
  };

  const EmptyCallback = function() {};
  const Utils = new (class {
    constructor() {
      this.timeParser = /(([0-9]*)d)?(([0-9]*)h)?(([0-9]*)m)?(([0-9]*)s)?/i;
    }

    mapToList(map, callback, condition = true, baseList = []) {
      Object.keys(map).forEach(id => (condition === true || condition(map[id])) && baseList.push(callback(map[id])));
      return baseList;
    }

    fromMap(map, id, defaultID) {
      return map.hasOwnProperty(id) ? map[id] : map[defaultID];
    }

    arrayIntoChunks(array, size) {
      return this.intoChunks(array, size)
    }

    assignToMap(array, callback) {
      const obj = {};
      array.forEach(a => obj[a] = callback(a));
      return obj;
    }

    intoChunks(array, size = 100, handle = function(a) { return a; }) {
      const queryN = Math.ceil(array.length / size);
      const queryCount = Math.floor(array.length / queryN);
      const rest = array.length - (queryCount * queryN);

      const chunks = [];
      for(let i = 0; i < queryN; i++) {
        const chunk = [];
        array.slice(i * queryCount, (i + 1) * queryCount).forEach(e => chunk.push(handle(e)))
        chunks.push(chunk);
      }

      const lastEntries = array.slice(queryN * queryCount, array.length);
      for(let i = 0; i < rest; i++) {
        chunks[i].push(handle(lastEntries[i]));
      }

      return chunks;
    }

    handleArray(array, handle) {
      array = array.slice();
      for(let i = 0; i < array.length; i++) {
        array[i] = handle(array[i]);
      }

      return array;
    }

    getJSON(url, headers = {}, notOk = false) {
      return fetch(url, {
        headers: headers
      })
      .then(r => r.ok ? r.json() : notOk)
      .catch(err => console.log(err));
    }

    asArray(o, more) {
      if(!Array.isArray(o)) {
        o = [o];
      }

      o.push.apply(o, more);

      return o;
    }

    asString(o, prefix = '', suffix = '') {
      return typeof o !== 'undefined' ? prefix + o + suffix : '';
    }

    nextPossible(ID, o, start = 0) {
      while(o.hasOwnProperty(ID)) {
        (++ID > (Object.keys(o).length + start)) && (ID = start);
      }

      return ID;
    }

    getRandom(min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min);
    }

    asNumber(o) {
      return isNaN(o = parseInt(o)) ? 0 : o;
    }

    parseTime(s, multiplier = 1000) {
      s = s.match(this.timeParser);
      let m = 24 * this.asNumber(s[2]);
      m = (m + this.asNumber(s[4])) * 60;
      m = (m + this.asNumber(s[6])) * 60;

      return multiplier * (m + this.asNumber(s[8]));
    }

    get emptyCallback() {
      return EmptyCallback;
    }

    path(dirPath, path, type) {
      return dirPath + Utils.asString(path, '/') + Utils.asString(type, '.');
    }

    between(number, min = 0, max = 1) {
      return Math.min(max, Math.max(min, number));
    }
  })();

  const WebApp = new (class {
    constructor() {
      this.classes = {};
      this.imports = {};

      this.importsResolve = {};
      this.importsPromise = {};

      this.svgs    = {
        /* |Compiler:SVG| */
      };

      this.errorChar = String.fromCharCode(1);
      this.noResponseChar = String.fromCharCode(2);
    }

    get error() {
      return this.errorChar;
    }

    get noResponse() {
      return this.noResponseChar;
    }

    load(dirName) {
      fetch(Utils.path(dirName, 'main.json'))
      .then(async r => {
        if(!r.ok) {
          console.log('err loading:', dirName);
          return;
        }

        const config = await r.json();

        config.files.forEach(file => {
          if(config.type === 'css') {
            let style = document.createElement('link');
            style.rel = 'stylesheet';
            style.type = 'text/css';
            style.href = Utils.path(dirName, file, config.type);
            document.getElementsByTagName('head')[0].appendChild(style);
          }

          if(config.type === 'js') {
            fetch(Utils.path(dirName, file, config.type))
            .then(async r => r.ok && await r.text())
            .then(input => {
              const orginal = input;
              for(let op in CustomOperators) {
                input = CustomOperators[op]._apply(input);
              }

              try {
                (new Function('a', `((async () => {
                  ${input}
                })());`))();
              } catch(e) {
                console.log(e, Utils.path(dirName, file, config.type));
                console.log(`((async () => {
                  ${input}
                })());`);
              }
            });
          }
        });

      }).catch(err => {
        console.log(err, dirName);
      });
    }

    async svg(...names) {
      if(names.length > 1) {
        for(let i = 0; i < names.length; i++) {
          names[i] = await this.svg(names[i]);
        }
        return names;
      }

      return this.svgs.hasOwnProperty(names[0]) ? this.svgs[names[0]] : this.svgs[names[0]] = await fetch(`/svgs/${names[0]}.svg`).then(r => r.text()).catch(err => console.log(err));
    }

    svgbase64(svg, width = 32, height = 32) {
      return new Promise(resolve => {
        const image = new Image();
        image.src = 'data:image/svg+xml;utf8,'+ encodeURIComponent(svg);

        image.onload = () => {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = Math.min(width, image.width);
          canvas.height = Math.min(height, image.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);

          resolve(context.getImageData(0, 0, canvas.width, canvas.height));
        };
      });
    }

    importArray(name) {
      return this.imports.hasOwnProperty(name) ? this.imports[name] : this.imports[name] = [];
    }

    importResolve(name) {
      return this.importsPromise.hasOwnProperty(name) ? this.importsPromise[name] : this.importsPromise[name] = new Promise(resolve => {
        const unfoundTimeout = setTimeout(() => {
          // resolve(null);
          throw new Error(`${name} could not load`);
        }, 1000);

        this.importsResolve[name] = (classe) => {
          resolve(classe);
          clearTimeout(unfoundTimeout);
        };
      });
    }

    async get(...names) {
      if(names.length > 1) {
        const list = [];
        for(let i = 0; i < names.length; i++) {
          list[i] = await this.get(names[i]);
        }
        return list;
      }

      return this.classes.hasOwnProperty(names[0]) ? this.classes[names[0]] : this.importResolve(names[0]);
    }

    isInstance(object, name) {
      (typeof object === 'string') && ([name, object] = [object, name]);
      return this.classes.hasOwnProperty(name) && (object instanceof this.classes[name]) ;
    }

    register(name, classe) {
      if(this.importsResolve.hasOwnProperty(name)) {
        this.importsResolve[name](classe);
        delete this.importsResolve[name];
      }

      this.classes[name] = classe;
      return this;
    }
  })();

  WebApp.register('Throttle', Throttle);
  WebApp.register('Utils', Utils);
  WebApp.register('WebQuery', WebQuery);
  WebApp.register('Wait', Wait);
  WebApp.register('Chunks', Chunks);

  return WebApp;
}());
