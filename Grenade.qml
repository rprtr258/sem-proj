import QtQuick 2.0

Item {
    property bool explosion: false

    Image {
        anchors.fill: parent.center
        height: 30
        width: 30
        source: "qrc:/img/grenade.png"
        visible: !explosion
    }
    SpriteSequence {
        id: sprite
        height: 200
        width: 200
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.bottom: parent.bottom
        anchors.bottomMargin: -40
        running: true
        Sprite {
            name: "none"
            source: "qrc:/img/explosion.png"
            frameX: 0
            frameY: 0
            frameHeight: 1
            frameWidth: 1
            frameCount: 1
            frameDuration: 10
        }
        Sprite {
            name: "explosion"
            source: "qrc:/img/explosion.png"
            frameX: 0
            frameY: 0
            frameHeight: 256
            frameWidth: 256
            frameCount: 39
            frameDuration: 10
        }
    }
    states: [
        State {
            when: explosion
            StateChangeScript {
                script: sprite.jumpTo("explosion");
            }
        },
        State {
            when: !explosion
            StateChangeScript {
                script: sprite.jumpTo("none");
            }
        }
    ]
}
