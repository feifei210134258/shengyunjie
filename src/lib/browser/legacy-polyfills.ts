export const LEGACY_BROWSER_POLYFILLS = `
(function () {
  function toInteger(value) {
    var number = Number(value) || 0;
    return number < 0 ? Math.ceil(number) : Math.floor(number);
  }

  if (!Array.prototype.at) {
    Object.defineProperty(Array.prototype, "at", {
      configurable: true,
      writable: true,
      value: function at(index) {
        var length = this == null ? 0 : this.length >>> 0;
        var relativeIndex = toInteger(index);
        var actualIndex = relativeIndex >= 0 ? relativeIndex : length + relativeIndex;
        return actualIndex < 0 || actualIndex >= length ? undefined : this[actualIndex];
      }
    });
  }

  if (!Array.prototype.flat) {
    Object.defineProperty(Array.prototype, "flat", {
      configurable: true,
      writable: true,
      value: function flat(depth) {
        var source = Object(this);
        var length = source.length >>> 0;
        var maxDepth = depth === undefined ? 1 : toInteger(depth);
        var result = [];

        function flatten(arrayLike, arrayLength, currentDepth) {
          for (var i = 0; i < arrayLength; i += 1) {
            if (!(i in arrayLike)) continue;
            var item = arrayLike[i];
            if (Array.isArray(item) && currentDepth > 0) {
              flatten(item, item.length >>> 0, currentDepth - 1);
            } else {
              result.push(item);
            }
          }
        }

        flatten(source, length, maxDepth);
        return result;
      }
    });
  }

  if (!Array.prototype.flatMap) {
    Object.defineProperty(Array.prototype, "flatMap", {
      configurable: true,
      writable: true,
      value: function flatMap(callback, thisArg) {
        if (typeof callback !== "function") {
          throw new TypeError("Array.prototype.flatMap callback must be a function");
        }
        return Array.prototype.map.call(this, callback, thisArg).flat();
      }
    });
  }

  if (!String.prototype.at) {
    Object.defineProperty(String.prototype, "at", {
      configurable: true,
      writable: true,
      value: function at(index) {
        var value = String(this);
        var length = value.length;
        var relativeIndex = toInteger(index);
        var actualIndex = relativeIndex >= 0 ? relativeIndex : length + relativeIndex;
        return actualIndex < 0 || actualIndex >= length ? undefined : value.charAt(actualIndex);
      }
    });
  }

  if (!String.prototype.replaceAll) {
    Object.defineProperty(String.prototype, "replaceAll", {
      configurable: true,
      writable: true,
      value: function replaceAll(searchValue, replaceValue) {
        var value = String(this);
        if (searchValue instanceof RegExp) {
          if (!searchValue.global) {
            throw new TypeError("String.prototype.replaceAll called with a non-global RegExp argument");
          }
          return value.replace(searchValue, replaceValue);
        }
        return value.split(String(searchValue)).join(String(replaceValue));
      }
    });
  }
})();
`;
