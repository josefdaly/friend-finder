function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

var uuid = guid();

var Map = {
  initializeMap: function() {
    var mapProp = {
      center: new google.maps.LatLng(40, 40),
      zoom: 17,
      mapTypeId: google.maps.MapTypeId.TERRAIN,
      stylers: [
        { visibility: 'off' }
      ]
    };
    this.map = new google.maps.Map(document.getElementById("googleMap"), mapProp);
    this.location = {
      lat: 0,
      lng: 0
    };
    this.markers = {};
    this.startPositionWatcher();
    setTimeout(function() {
      this.setCenter();
    }.bind(this), 2500)
  },
  startPositionWatcher: function() {
    var options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
      desiredAccuracy: 0,
    }
    navigator.geolocation.watchPosition(
      function(position) {
        this.location.lat = position.coords.latitude;
        this.location.lng = position.coords.longitude;
      }.bind(this),
      function(error) {
        alert(error.message);
      },
      options
    );
  },
  setCenter: function() {
    this.map.setCenter(this.location);
  },
  createOrUpdateMarker: function(id, location) {
    if (this.markers[id]) {
      this.markers[id].obj.setPosition(location);
    } else {
      this.markers[id] = {
        lastUpdated: Date.now(),
        obj: new google.maps.Marker({
          position: location,
          map: this.map,
          icon: "http://icons.iconarchive.com/icons/icons8/windows-8/16/Sports-Running-icon.png"
        })
      }
    }
    // Terminates marker if no update within 10 seconds
    setTimeout(function() {
      var timeNow = Date.now()
      if (this.markers[id]){
        if (timeNow - 9500 > this.markers[id].lastUpdated) {
          this.markers[id].obj.setMap(null);
          delete this.markers[id]
        }
      }
    }.bind(this), 10000)
  }
}

window.onload = function() {
  (function(){
    Map.initializeMap()
    var ws = new WebSocket('ws://' + window.location.host + window.location.pathname);
    ws.onopen = function() {
      //stuff
    }
    ws.onclose = function() {
    }
    ws.onmessage = function(m) {
      var msg = JSON.parse(m.data);
      if (msg.type === 'location-update') {
        Map.createOrUpdateMarker(msg.uuid, msg.location)
      }
    }
    var interval = setInterval(function() {
      if (ws.readyState === 1) {
        ws.send(
          JSON.stringify(
            {
              'type': 'location-update',
              'uuid': uuid,
              'location': Map.location
            }
          )
        );
      } else {
        clearInterval(interval)
      }
    },100)
  })();
}
