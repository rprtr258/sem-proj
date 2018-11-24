import QtQuick 2.0

Item {
    property bool mirrored : false
    property bool going : false
    property bool gg: false
    property bool inAir: true
    id: player
    SpriteSequence {
        id: sprite
        height: 95
        width: 55
        running: true
        Sprite {
            name: "standing"
            source: "qrc:/img/transparent_sheet.png"
            frameX: 0
            frameY: 0
            frameHeight: 96
            frameWidth: 55
            frameCount: 16
            frameRate: 10
        }
        Sprite {
            name: "running"
            source: "qrc:/img/transparent_sheet.png"
            frameX: 0
            frameY: 96
            frameHeight: 93
            frameWidth: 54
            frameCount: 10
        }
        Sprite {
            name: "jumping"
            source: "qrc:/img/transparent_sheet.png"
            frameX: 0
            frameY: 188
            frameHeight: 104
            frameWidth: 61
            frameCount: 9
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
            when: inAir
            StateChangeScript {
                script: sprite.jumpTo("jumping");
            }
        },
        State {
            when: !inAir && !going
            StateChangeScript {
                script: sprite.jumpTo("standing");
            }
        },
        State {
            when: !inAir && going
            StateChangeScript {
                script: sprite.jumpTo("running");
            }
        }
    ]
    Behavior on x {
        NumberAnimation {
            duration: 20
            easing.type: Easing.Linear
        }
    }
    Behavior on y {
        NumberAnimation {
            duration: 20
            easing.type: Easing.Linear
        }
    }
}
