import QtQuick 2.0

Item {
    property int spellId

    SpriteSequence {
        id: sprite
        height: 28
        width: 17
        running: true
        Sprite {
            name: "0"
            source: "qrc:/img/spells.png"
            frameX: 0
            frameY: 0
            frameHeight: 28
            frameWidth: 17
            frameCount: 1
        }
        Sprite {
            name: "1"
            source: "qrc:/img/spells.png"
            frameX: 17
            frameY: 0
            frameHeight: 28
            frameWidth: 17
            frameCount: 1
        }
        Sprite {
            name: "2"
            source: "qrc:/img/spells.png"
            frameX: 34
            frameY: 0
            frameHeight: 28
            frameWidth: 17
            frameCount: 1
        }
    }
    states: [
        State {
            when: spellId === 0
            StateChangeScript {
                script: sprite.jumpTo("0");
            }
        },
        State {
            when: spellId === 1
            StateChangeScript {
                script: sprite.jumpTo("1");
            }
        },
        State {
            when: spellId === 2
            StateChangeScript {
                script: sprite.jumpTo("2");
            }
        }
    ]
}
