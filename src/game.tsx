import * as THREE from "three";
import { Entity } from "./entity";
import * as ReactDOM from "react-dom";
import * as React from "react";
import { DigitalController } from "./interface/digital-controller";
import { PlayerInputManager, InputStatus } from "./player-input-manager";
import { Vector3, Vector2 } from "three";
import { ActionDescriptor } from "./interface/action-descriptor";
import { Interface } from "./interface/interface";

export class Game {
    element: HTMLElement;
    readonly scene: THREE.Scene;
    readonly camera: THREE.Camera;
    readonly renderer: THREE.WebGLRenderer;
    party: Entity[];
    _player: Entity;
    playerInputManager: PlayerInputManager;
    private interface: Interface;
    private entities: Entity[];
    private directionalLight: THREE.DirectionalLight;
    public textVariables: {
        [index: string]: number | string;
    };
    private mouseTooltip: ActionDescriptor;
    private container: HTMLDivElement;
    constructor() {
        

        this.entities = [];
        this.textVariables = {};
        //Adding our default CSS
        var cssLink = document.createElement("link");

        //TODO: upload the css file to GitHub pages
        cssLink.href = "http://127.0.0.1:5500/dist/defaultStyles.css";
        cssLink.rel = "stylesheet";
        document.head.appendChild(cssLink);

        //Player Input
        var controllerDiv = document.createElement("div");
        PlayerInputManager.loadControlBindings().then((controlBindings) => {
            this.playerInputManager = new PlayerInputManager(controlBindings);
        });
        
        //THREE stuff
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        this.camera.position.set(0,20,7);
        this.camera.rotation.set((-1.8 * Math.PI)/4, 0, 0); //rotation.set((-1.3 * Math.PI)/4, 0, 0);

        this.directionalLight = new THREE.DirectionalLight( 0xffffff, 1);
        this.directionalLight.position.set( 10, 5, -10 );
        this.directionalLight.castShadow = true;
        
        this.scene.add(this.directionalLight);
        
        var ambientLight = new THREE.AmbientLight( 0xffffff, 0.6);
        this.scene.add(ambientLight);

        this.renderer = new THREE.WebGLRenderer(/*{alpha: true}*/);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMapType = THREE.PCFSoftShadowMap;
        this.renderer.setSize( window.innerWidth, window.innerHeight );

        //GUI
        this.element = document.createElement("div");
        this.element.appendChild(this.renderer.domElement);
        this.element.appendChild(this.container);

        this.animate();

        this.interface = new Interface(this);
    }
    animate() {
        //window.setTimeout(this.animate.bind(this), 150)
        requestAnimationFrame(this.animate.bind(this));
        for (var i = 0; i < this.entities.length; i++) {
            this.entities[i].update(1);
        }
        if(this.playerInputManager) {
            this.playerInputManager.update();
            // -->   this.interface.digitalController.setStatus(this.playerInputManager.inputStatus);
            if(this.player) {
                //this.camera.lookAt(this.player.object.position);
                this.player.controlVector = this.playerInputManager.controlVector;
                //this.camera.rotation.set(this.playerInputManager.controlVector.x * 0.5, this.playerInputManager.controlVector.y * 0.5, 0);
                //console.log(this.player.checkForCollision(this.collisionableEntities, this.scene));
            }
        }
        this.renderer.render(this.scene,this.camera);
        this.interface.update();
    }
    get collisionableEntities(): Entity[] {
        return this.entities.filter((entity) => entity.collidable)
    }
    get player() {
        return this._player;
    }
    set player(value: Entity) {
        this._player = value;
        this.directionalLight.target = this.player.object;
    }
    addEntity(entity: Entity) {
        //console.log(entity);
        this.entities.push(entity);
        this.scene.add(entity.object);
    }
    getHoveredEntity(event: MouseEvent) {
        var raycaster = new THREE.Raycaster();
        var mouse = new THREE.Vector2(( event.clientX / this.renderer.domElement.clientWidth ) * 2 - 1, - (event.clientY / this.renderer.domElement.clientHeight) * 2 + 1);

        raycaster.setFromCamera( mouse, this.camera );

        return raycaster.intersectObjects( this.entities.filter((entity) => entity.actionDescriptor).map((entity) => entity.object), true )[0];
    }
}