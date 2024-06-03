class Scene {
    constructor() {
      this.zoom = 1;
      this.transX = 0;
      this.transY = 0;
      this.rotX = 0;
      this.rotY = 0;
      this.rotZ = 0;
    }
  
    setZoom(value) {
      this.zoom = value;
    }
    getZoom() {
      return this.zoom;
    }
    setTransX(value) {
        this.transX = value;
    }
    getTransX() {
        return this.transX; 
    }
    setTransY(value) {
        this.transY = value;
    }
    getTransY() {
        return this.transY; 
    }
    setRotX(value){
        this.rotX = value;
    }
    getRotX(){
        return this.rotX;
    }
    setRotY(value){
        this.rotY = value;
    }
    getRotY(){
        return this.rotY;
    } 
    setRotZ(value){
        this.rotZ = value;
    }
    getRotZ(){
        return this.rotZ;
    } 
    reset(){
        this.zoom = 1;
        this.transX = 0;
        this.transY = 0;
        this.rotX = 0;
        this.rotY = 0;
        this.rotZ = 0;
    }
  }