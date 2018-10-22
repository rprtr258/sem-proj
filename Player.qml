import QtQuick 2.0

Item {
    property bool mirrored : false
    property bool going : false
    property bool gg: false
    id: player
    SpriteSequence {
        id: sprite
        height: 95
        width: 55
        running: true
        Sprite {
            name: "standing"
            source: "qrc:/img/hero.png"
            frameX: 0
            frameY: 25
            frameHeight: 95
            frameWidth: 55
            frameCount: 16
            frameRate: 10
        }
        Sprite {
            name: "running"
            source: "qrc:/img/hero.png"
            frameX: 0
            frameY: 170
            frameHeight: 95
            frameWidth: 54
            frameCount: 10
        }
        transform: [
            Scale {
                origin.x: sprite.width / 2
                xScale: mirrored ? 1 : -1
            }
        ]
    }
    function run() {
        if (!gg) {
            sprite.jumpTo("running");
            console.log(gg)
            gg = true;
        }
    }
    function stop() {
        if (gg) {
            sprite.jumpTo("standing");
            gg = false;
        }
    }
    states: [
        State {
            when: !going
            StateChangeScript {
                script: sprite.jumpTo("standing");
            }
        },
        State {
            when: going
            StateChangeScript {
                script: sprite.jumpTo("running");
            }
        }
    ]
}
