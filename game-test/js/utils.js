// Utils class - Provides utility functions for the game

class Utils {
  constructor() {
    // Time tracking
    this.lastTime = 0;
    this.deltaTime = 0;
    this.elapsedTime = 0;

    // Initialize time
    this.updateTime();
  }

  updateTime() {
    const currentTime = performance.now();

    if (this.lastTime > 0) {
      this.deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
      this.elapsedTime += this.deltaTime;
    }

    this.lastTime = currentTime;
  }

  getDeltaTime() {
    this.updateTime();
    return this.deltaTime;
  }

  getElapsedTime() {
    return this.elapsedTime;
  }

  // Random number utilities
  random(min, max) {
    return Math.random() * (max - min) + min;
  }

  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Vector utilities
  distanceBetween(x1, y1, z1, x2, y2, z2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dz = z2 - z1;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // Angle utilities
  degToRad(degrees) {
    return (degrees * Math.PI) / 180;
  }

  radToDeg(radians) {
    return (radians * 180) / Math.PI;
  }

  // Lerp (Linear interpolation)
  lerp(start, end, t) {
    return start * (1 - t) + end * t;
  }

  // Clamp a value between min and max
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  // Check if a point is inside a rectangle
  pointInRect(x, y, rectX, rectY, rectWidth, rectHeight) {
    return (
      x >= rectX &&
      x <= rectX + rectWidth &&
      y >= rectY &&
      y <= rectY + rectHeight
    );
  }

  // Generate a unique ID
  generateId() {
    return "_" + Math.random().toString(36).substr(2, 9);
  }

  // Format time (seconds) to MM:SS format
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  // Add CSS class to element
  addClass(element, className) {
    if (element.classList) {
      element.classList.add(className);
    } else {
      element.className += " " + className;
    }
  }

  // Remove CSS class from element
  removeClass(element, className) {
    if (element.classList) {
      element.classList.remove(className);
    } else {
      element.className = element.className.replace(
        new RegExp(
          "(^|\\b)" + className.split(" ").join("|") + "(\\b|$)",
          "gi"
        ),
        " "
      );
    }
  }

  // Toggle CSS class on element
  toggleClass(element, className) {
    if (element.classList) {
      element.classList.toggle(className);
    } else {
      const classes = element.className.split(" ");
      const existingIndex = classes.indexOf(className);

      if (existingIndex >= 0) {
        classes.splice(existingIndex, 1);
      } else {
        classes.push(className);
      }

      element.className = classes.join(" ");
    }
  }

  // Load an image and return a promise
  loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  }

  // Deep clone an object
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // Check if mobile device
  isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  // Detect browser
  getBrowser() {
    const userAgent = navigator.userAgent;
    let browser = "Unknown";

    if (userAgent.indexOf("Firefox") > -1) {
      browser = "Firefox";
    } else if (userAgent.indexOf("SamsungBrowser") > -1) {
      browser = "Samsung";
    } else if (
      userAgent.indexOf("Opera") > -1 ||
      userAgent.indexOf("OPR") > -1
    ) {
      browser = "Opera";
    } else if (userAgent.indexOf("Trident") > -1) {
      browser = "Internet Explorer";
    } else if (userAgent.indexOf("Edge") > -1) {
      browser = "Edge";
    } else if (userAgent.indexOf("Chrome") > -1) {
      browser = "Chrome";
    } else if (userAgent.indexOf("Safari") > -1) {
      browser = "Safari";
    }

    return browser;
  }

  // Get URL parameters
  getUrlParams() {
    const params = {};
    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, (m, key, value) => {
      params[key] = decodeURIComponent(value);
    });
    return params;
  }

  // Debounce function to limit how often a function can be called
  debounce(func, wait) {
    let timeout;
    return function (...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }

  // Throttle function to limit how often a function can be called
  throttle(func, limit) {
    let inThrottle;
    return function (...args) {
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }
}
