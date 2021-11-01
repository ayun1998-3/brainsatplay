class BLE { //This is formatted for the way the HEG sends/receives information. Other BLE devices will likely need changes to this to be interactive.
    constructor(
        namePrefix  = 'BT832A',
        serviceUUID = '0000CAFE-B0BA-8BAD-F00D-DEADBEEF0000', //BLE service ID
        rxUUID      = '0001CAFE-B0BA-8BAD-F00D-DEADBEEF0000',      //WRITE characteristic
        txUUID      = '0002CAFE-B0BA-8BAD-F00D-DEADBEEF0000',      //NOTIFY characteristic
        otaServiceUuid            = serviceUUID,                            //don't worry about these for now
        versionCharacteristicUuid = '6E400006-B5A3-F393-E0A9-E50E24DCCA9E', // ..
        fileCharacteristicUuid    = '6E400006-B5A3-F393-E0A9-E50E24DCCA9E', //  ..
        defaultUI = false, 
        async = false )
    {
    
    this.namePrefix  = namePrefix;
    this.serviceUUID = serviceUUID.toLowerCase();
    this.rxUUID      = rxUUID.toLowerCase(); //characteristic that can receive input from this device
    this.txUUID      = txUUID.toLowerCase(); //characteristic that can transmit input to this device
    this.encoder     = new TextEncoder("utf-8");
    this.decoder     = new TextDecoder("utf-8");

    this.device  = null;
    this.server  = null;
    this.service = null;

    this.async = async;

    this.android = navigator.userAgent.toLowerCase().indexOf("android") > -1; //Use fast mode on android (lower MTU throughput)

    this.n; //nsamples


    //BLE Updater modified from this sparkfun tutorial: https://learn.sparkfun.com/tutorials/esp32-ota-updates-over-ble-from-a-react-web-application/all
    
    //See original copyright:
    /*************************************************** 
     This is a React WebApp written to Flash an ESP32 via BLE
    
    Written by Andrew England (SparkFun)
    BSD license, all text above must be included in any redistribution.
    *****************************************************/

    this.otaServiceUuid = otaServiceUuid.toLowerCase();
    this.versionCharacteristicUuid = versionCharacteristicUuid.toLowerCase();
    this.fileCharacteristicUuid = fileCharacteristicUuid.toLowerCase();

    this.otaService = null;
    this.readyFlagCharacteristic = null;
    this.dataToSend = null;
    this.updateData = null;

    this.totalSize;
    this.remaining;
    this.amountToWrite;
    this.currentPosition;

    this.currentHardwareVersion = "N/A";
    this.softwareVersion = "N/A";
    this.latestCompatibleSoftware = "N/A";

    this.characteristicSize = 512; //MTUs //20 byte limit on android   

    if(defaultUI === true){
        this.initUI(undefined, buttonId);
    }
     
    }
 
    connect = () => {
        if(this.async === false) this._connect();
        else this.initBLEasync();
    }
 
    //Typical web BLE calls
    _connect = async (
        serviceUUID = this.serviceUUID, 
        rxUUID      = this.rxUUID, 
        txUUID      = this.txUUID) => 
    { //Must be run by button press or user-initiated call
        let err = false;
        await navigator.bluetooth.requestDevice({   
            //    acceptAllDevices: true,
            filters: [{ services: [serviceUUID] }, { namePrefix: this.namePrefix }],
            optionalServices: [serviceUUID] 
        })
        .then(device => {
            this.device = device;
            return device.gatt.connect(); //Connect to HEG
        })
        .then(sleeper(100))
        .then(server => server.getPrimaryService(serviceUUID))
        .then(sleeper(100))
        .then(service => { //over-the-air updates
            this.service = service;
            this.otaService = service;
            service.getCharacteristic(rxUUID).then(sleeper(100)).then(tx => {
                 this.rxchar = tx;
                 //return tx.writeValue(this.encoder.encode("t")); // Send command to start HEG automatically (if not already started)
            });
            if(this.android == true){
                service.getCharacteristic(rxUUID).then(sleeper(1000)).then(tx => {
                    //return tx.writeValue(this.encoder.encode("o")); // Fast output mode for android
                });
            }
            return service.getCharacteristic(txUUID) // Get stream source
        })
        .then(sleeper(1100))
        .then(characteristic=>{
            this.txchar = characteristic;
            this.onConnectedCallback();
            return characteristic.startNotifications(); // Subscribe to stream
        })
        .then(sleeper(100))
        .then(characteristic => {
            characteristic.addEventListener(
                'characteristicvaluechanged',
                this.onNotificationCallback) //Update page with each notification
        })
        .then(sleeper(100))
        .catch(err => {console.error(err); this.onErrorCallback(err); err = true;});
        
        function sleeper(ms) {
            return function(x) {
                return new Promise(resolve => setTimeout(() => resolve(x), ms));
            };
        }
    }
 
    onNotificationCallback = (e) => { //Customize this with the UI (e.g. have it call the handleScore function)
      var val = this.decoder.decode(e.target.value);
      console.log("BLE MSG: ",val);
    }   
 
    onConnectedCallback = () => {
       //Use this to set up the front end UI once connected here
    }

    onErrorCallback = (err) => {
        //Use this to set up the front end UI once connected here
    }
 
    sendMessage = (msg) => {
        if (this.service) 
            this.service.getCharacteristic(this.rxUUID)
            .then(tx => {return tx.writeValue(this.encoder.encode(msg));});
    }

    //get the file to start the update process
    getFile() {
        var input = document.createElement('input');
        input.accept = '.bin';
        input.type = 'file';

        input.onchange = (e) => {
            var file = e.target.files[0];
            var reader = new FileReader();
            reader.onload = (event) => {
                this.updateData = event.target.result;
                this.SendFileOverBluetooth();
                input.value = '';
            }
            reader.readAsArrayBuffer(file);
        }
        input.click();
    }

    /* SendFileOverBluetooth(data)
    * Figures out how large our update binary is, attaches an eventListener to our dataCharacteristic so the Server can tell us when it has finished writing the data to memory
    * Calls SendBufferedData(), which begins a loop of write, wait for ready flag, write, wait for ready flag...
    */
    SendFileOverBluetooth() {
        if(!this.otaService)
        {
            console.log("No ota Service");
            return;
        }
        
        this.totalSize = this.updateData.byteLength;
        this.remaining = this.totalSize;
        this.amountToWrite = 0;
        this.currentPosition = 0;

        this.otaService.getCharacteristic(this.fileCharacteristicUuid)
        .then(characteristic => {
            this.readyFlagCharacteristic = characteristic;
            return characteristic.startNotifications()
            .then(_ => {
                this.readyFlagCharacteristic.addEventListener('characteristicvaluechanged', this.SendBufferedData)
            });
        })
        .catch(error => { 
            console.log(error); 
        });
        this.SendBufferedData();
    }

    /* SendBufferedData()
    * An ISR attached to the same characteristic that it writes to, this function slices data into characteristic sized chunks and sends them to the Server
    */
    SendBufferedData() {
        if (this.remaining > 0) {
            if (this.remaining >= this.characteristicSize) {
                this.amountToWrite = this.characteristicSize
            }
            else {
                this.amountToWrite = this.remaining;
            }

            this.dataToSend = this.updateData.slice(this.currentPosition, this.currentPosition + this.amountToWrite);
            this.currentPosition += this.amountToWrite;
            this.remaining -= this.amountToWrite;
            console.log("remaining: " + this.remaining);

            this.otaService.getCharacteristic(this.fileCharacteristicUuid)
            .then(characteristic => this.RecursiveSend(characteristic, this.dataToSend))
            .then(_ => {
                let progress = (100 * (this.currentPosition/this.totalSize)).toPrecision(3) + '%';
                this.onProgress(progress);
                return;
            })
            .catch(error => { 
                console.log(error); 
            });
        }
    }

    onProgress(progress) {
        console.log("Update Progress: ", progress);
    }

    RecursiveSend(characteristic, data) {
        return characteristic.writeValue(data)
        .catch(error => {
            return this.RecursiveSend(characteristic, data);
        });
    }




 
    //Async solution fix for slower devices (android). This is slower than the other method on PC. Credit Dovydas Stirpeika
    async connectAsync() {
         this.device = await navigator.bluetooth.requestDevice({
             filters: [{ namePrefix: this.namePrefix }],
             optionalServices: [this.serviceUUID]
         });
 
         console.log("BLE Device: ", this.device);
         
         const btServer = await this.device.gatt?.connect();
         if (!btServer) throw 'no connection';
         this.device.addEventListener('gattserverdisconnected', onDisconnected);
         
         this.server = btServer;
         
         const service = await this.server.getPrimaryService(this.serviceUUID);
         
         // Send command to start HEG automatically (if not already started)
         const tx = await service.getCharacteristic(this.rxUUID);
         //await tx.writeValue(this.encoder.encode("t"));
 
         if(this.android == true){
           //await tx.writeValue(this.encoder.encode("o"));
         }
         
         this.characteristic = await service.getCharacteristic(this.txUUID);
          this.onConnectedCallback();
         return true;
     }
 
     disconnect = () => {
         this.server?.disconnect(); this.onDisconnectedCallback()
     };
 
     onDisconnectedCallback = () => {
       console.log("BLE device disconnected!");
     }
 
     async readDeviceAsync () {
         if (!this.characteristic) {
             console.log("HEG not connected");
             throw "error";
         }
 
         // await this.characteristic.startNotifications();
         this.doReadHeg = true;
         
         var data = ""
         while (this.doReadHeg) {
             const val = this.decoder.decode(await this.characteristic.readValue());
             if (val !== this.data) {
                 data = val;
                 console.log(data);
                 //data = data[data.length - 1];
                 //const arr = data.replace(/[\n\r]+/g, '')
                 this.n += 1;
                 this.onReadAsyncCallback(data);
             }
         }
     }
 
     onReadAsyncCallback = (data) => {
       console.log("BLE Data: ",data)
     }
 
     stopReadAsync = () => {
         this.doReadHeg = false;
         tx.writeValue(this.encoder.encode("f"));
     }
 
     spsinterval = () => {
       setTimeout(() => {
         console.log("SPS", this.n + '');
         this.n = 0;
         this.spsinterval();
       }, 1000);
     }
 
     async initBLEasync() {
       await this.connectAsync();
       this.readDeviceasync();
       this.spsinterval();
     }
       
 }