```js
(async function() {
    console.clear();
    console.log("🕵️ 正在注入字幕拦截器...");

    // --- 1. 拦截 Fetch 请求 ---
    const originalFetch = window.fetch;
    window.fetch = async function(input, init) {
        const url = (typeof input === 'string') ? input : input.url;
        // 监听字幕 API 请求
        if (url && url.includes('/api/timedtext')) {
            console.log("🎯 [Fetch] 捕获到字幕请求:", url);
            const response = await originalFetch.apply(this, arguments);
            const clone = response.clone();
            try {
                const text = await clone.text();
                if (text) {
                    console.log("%c✅ [Fetch] 成功捕获字幕内容！", "color: green; font-weight: bold; font-size: 14px;");
                    console.log("--------------------------------------------------");
                    console.log(text);
                    console.log("--------------------------------------------------");
                }
            } catch (e) {
                console.error("❌ [Fetch] 读取响应失败:", e);
            }
            return response;
        }
        return originalFetch.apply(this, arguments);
    };

    // --- 2. 拦截 XHR 请求 (以防万一) ---
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url) {
        this._url = url;
        return originalOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function(body) {
        this.addEventListener('load', function() {
            if (this._url && this._url.includes('/api/timedtext')) {
                console.log("🎯 [XHR] 捕获到字幕请求:", this._url);
                if (this.responseText) {
                    console.log("%c✅ [XHR] 成功捕获字幕内容！", "color: green; font-weight: bold; font-size: 14px;");
                    console.log("--------------------------------------------------");
                    console.log(this.responseText);
                    console.log("--------------------------------------------------");
                }
            }
        });
        return originalSend.apply(this, arguments);
    };

    console.log("✅ 网络拦截器已就绪。");

    // --- 3. 操作播放器触发请求 ---
    const player = document.getElementById('movie_player');
    if (!player) {
        console.error("❌ 未找到播放器对象 (movie_player)，请确保在视频页面运行。");
        return;
    }

    // 获取可用字幕列表
    const tracks = player.getOption('captions', 'tracklist');
    if (!tracks || tracks.length === 0) {
        console.error("❌ 该视频没有可用字幕。");
        return;
    }

    // 寻找英文字幕 (优先非自动生成)
    let targetTrack = tracks.find(t => t.languageCode === 'en' && !t.kind); 
    if (!targetTrack) targetTrack = tracks.find(t => t.languageCode === 'en');
    if (!targetTrack) targetTrack = tracks[0]; // 都没有就选第一个

    console.log(`🔄 准备切换字幕以触发下载: ${targetTrack.name.simpleText} (${targetTrack.languageCode})`);

    // 强制重载字幕流程：
    // 1. 先关闭字幕
    player.setOption('captions', 'track', {}); 
    console.log("⏳ 已关闭字幕，等待 1 秒以重置状态...");
    
    await new Promise(r => setTimeout(r, 1000));
    
    // 2. 重新开启目标字幕
    console.log("🚀 重新开启字幕，等待拦截...");
    player.setOption('captions', 'track', targetTrack);
    
    // 3. 确保字幕模块已加载
    if (player.loadModule) {
        player.loadModule("captions"); 
    }
})();
```
在Chrome中打开某个视频，然后控制台运行以上代码，等两秒就会打印出字幕的原始数据。返回的字幕数据的示例如下，以 https://www.youtube.com/watch?v=eBVqcTEC3zQ 这个视频为例。
```json
{
  "wireMagic": "pb3",
  "pens": [ {
  
  } ],
  "wsWinStyles": [ {
  
  } ],
  "wpWinPositions": [ {
  
  } ],
  "events": [ {
    "tStartMs": 4005,
    "dDurationMs": 5331,
    "segs": [ {
      "utf8": "One little finger, one little finger, one little finger"
    } ]
  }, {
    "tStartMs": 9408,
    "dDurationMs": 1680,
    "segs": [ {
      "utf8": "Tap tap tap"
    } ]
  }, {
    "tStartMs": 11131,
    "dDurationMs": 1680,
    "segs": [ {
      "utf8": "Point your finger up"
    } ]
  }, {
    "tStartMs": 12890,
    "dDurationMs": 1731,
    "segs": [ {
      "utf8": "Point your finger down"
    } ]
  }, {
    "tStartMs": 14772,
    "dDurationMs": 2526,
    "segs": [ {
      "utf8": "Put it on your head"
    } ]
  }, {
    "tStartMs": 17420,
    "dDurationMs": 986,
    "segs": [ {
      "utf8": "Head!"
    } ]
  }, {
    "tStartMs": 22071,
    "dDurationMs": 5366,
    "segs": [ {
      "utf8": "One little finger, one little finger, one little finger"
    } ]
  }, {
    "tStartMs": 27487,
    "dDurationMs": 1411,
    "segs": [ {
      "utf8": "Tap tap tap"
    } ]
  }, {
    "tStartMs": 29086,
    "dDurationMs": 1644,
    "segs": [ {
      "utf8": "Point your finger up"
    } ]
  }, {
    "tStartMs": 31042,
    "dDurationMs": 1588,
    "segs": [ {
      "utf8": "Point your finger down"
    } ]
  }, {
    "tStartMs": 32724,
    "dDurationMs": 2685,
    "segs": [ {
      "utf8": "Put it on your nose"
    } ]
  }, {
    "tStartMs": 35481,
    "dDurationMs": 1071,
    "segs": [ {
      "utf8": "Nose!"
    } ]
  }, {
    "tStartMs": 39882,
    "dDurationMs": 5612,
    "segs": [ {
      "utf8": "One little finger, one little finger, one little finger"
    } ]
  }, {
    "tStartMs": 45595,
    "dDurationMs": 1585,
    "segs": [ {
      "utf8": "Tap tap tap"
    } ]
  }, {
    "tStartMs": 47274,
    "dDurationMs": 1521,
    "segs": [ {
      "utf8": "Point your finger up"
    } ]
  }, {
    "tStartMs": 49019,
    "dDurationMs": 1709,
    "segs": [ {
      "utf8": "Point your finger down"
    } ]
  }, {
    "tStartMs": 50952,
    "dDurationMs": 2510,
    "segs": [ {
      "utf8": "Put it on your chin"
    } ]
  }, {
    "tStartMs": 53585,
    "dDurationMs": 930,
    "segs": [ {
      "utf8": "Chin!"
    } ]
  }, {
    "tStartMs": 58070,
    "dDurationMs": 5411,
    "segs": [ {
      "utf8": "One little finger, one little finger, one little finger"
    } ]
  }, {
    "tStartMs": 63538,
    "dDurationMs": 1646,
    "segs": [ {
      "utf8": "Tap tap tap"
    } ]
  }, {
    "tStartMs": 65299,
    "dDurationMs": 1742,
    "segs": [ {
      "utf8": "Point your finger up"
    } ]
  }, {
    "tStartMs": 67120,
    "dDurationMs": 1701,
    "segs": [ {
      "utf8": "Point your finger down"
    } ]
  }, {
    "tStartMs": 68980,
    "dDurationMs": 2445,
    "segs": [ {
      "utf8": "Put it on your arm"
    } ]
  }, {
    "tStartMs": 71526,
    "dDurationMs": 1038,
    "segs": [ {
      "utf8": "Arm!"
    } ]
  }, {
    "tStartMs": 75923,
    "dDurationMs": 5703,
    "segs": [ {
      "utf8": "One little finger, one little finger, one little finger"
    } ]
  }, {
    "tStartMs": 81647,
    "dDurationMs": 1649,
    "segs": [ {
      "utf8": "Tap tap tap"
    } ]
  }, {
    "tStartMs": 83462,
    "dDurationMs": 1730,
    "segs": [ {
      "utf8": "Point your finger up"
    } ]
  }, {
    "tStartMs": 85249,
    "dDurationMs": 1739,
    "segs": [ {
      "utf8": "Point your finger down"
    } ]
  }, {
    "tStartMs": 87053,
    "dDurationMs": 2372,
    "segs": [ {
      "utf8": "Put it on your leg"
    } ]
  }, {
    "tStartMs": 89635,
    "dDurationMs": 1208,
    "segs": [ {
      "utf8": "Leg!"
    } ]
  }, {
    "tStartMs": 93956,
    "dDurationMs": 5642,
    "segs": [ {
      "utf8": "One little finger, one little finger, one little finger"
    } ]
  }, {
    "tStartMs": 99634,
    "dDurationMs": 1769,
    "segs": [ {
      "utf8": "Tap tap tap"
    } ]
  }, {
    "tStartMs": 101453,
    "dDurationMs": 1783,
    "segs": [ {
      "utf8": "Point your finger up"
    } ]
  }, {
    "tStartMs": 103272,
    "dDurationMs": 1752,
    "segs": [ {
      "utf8": "Point your finger down"
    } ]
  }, {
    "tStartMs": 105061,
    "dDurationMs": 2320,
    "segs": [ {
      "utf8": "Put it on your foot"
    } ]
  }, {
    "tStartMs": 107663,
    "dDurationMs": 860,
    "segs": [ {
      "utf8": "Foot!"
    } ]
  }, {
    "tStartMs": 108631,
    "dDurationMs": 2378,
    "segs": [ {
      "utf8": "Put it on your leg"
    } ]
  }, {
    "tStartMs": 111095,
    "dDurationMs": 1108,
    "segs": [ {
      "utf8": "Leg!"
    } ]
  }, {
    "tStartMs": 112231,
    "dDurationMs": 2495,
    "segs": [ {
      "utf8": "Put it on your arm"
    } ]
  }, {
    "tStartMs": 114783,
    "dDurationMs": 1118,
    "segs": [ {
      "utf8": "Arm!"
    } ]
  }, {
    "tStartMs": 115944,
    "dDurationMs": 2615,
    "segs": [ {
      "utf8": "Put it on your chin"
    } ]
  }, {
    "tStartMs": 118602,
    "dDurationMs": 807,
    "segs": [ {
      "utf8": "Chin!"
    } ]
  }, {
    "tStartMs": 119466,
    "dDurationMs": 2707,
    "segs": [ {
      "utf8": "Put it on your nose"
    } ]
  }, {
    "tStartMs": 122267,
    "dDurationMs": 796,
    "segs": [ {
      "utf8": "Nose!"
    } ]
  }, {
    "tStartMs": 123113,
    "dDurationMs": 2526,
    "segs": [ {
      "utf8": "Put it on your head"
    } ]
  }, {
    "tStartMs": 125755,
    "dDurationMs": 757,
    "segs": [ {
      "utf8": "Head!"
    } ]
  }, {
    "tStartMs": 126564,
    "dDurationMs": 2649,
    "segs": [ {
      "utf8": "Now let's wave goodbye"
    } ]
  }, {
    "tStartMs": 129229,
    "dDurationMs": 2590,
    "segs": [ {
      "utf8": "Goodbye!"
    } ]
  } ]
}

```