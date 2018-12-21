import QtQuick 2.0

Item {
    property bool mirrored : false
    property bool going : false
    property bool inAir: true
    property bool attack: false
    property int health: 100
    property int mana: 100
    property int weaponId: 0
    property int score: 0

    Spell {
        anchors.top: parent.top
        anchors.left: parent.left
        anchors.topMargin: -35
        anchors.leftMargin: -45
        spellId: weaponId
    }
    Text {
        text: score
        anchors.top: parent.top
        anchors.left: parent.left
        anchors.topMargin: -27
        anchors.leftMargin: 90
        style: Text.Outline
        styleColor: "#AAAAAA"
        scale: 2
    }
    Rectangle {
        anchors.top: parent.top
        anchors.left: parent.left
        anchors.topMargin: -30
        anchors.leftMargin: -(100 - sprite.width) / 2
        height: 10
        width: health
        clip: true
        Image {
            source: "qrc:/img/hp.png"
            anchors.top: parent.top
            anchors.left: parent.left
        }
    }
    Rectangle {
        anchors.top: parent.top
        anchors.left: parent.left
        anchors.topMargin: -20
        anchors.leftMargin: -(100 - sprite.width) / 2
        height: 10
        width: mana
        clip: true
        Image {
            source: "qrc:/img/mana.png"
            anchors.top: parent.top
            anchors.left: parent.left
        }
    }
    SpriteSequence {
        id: sprite
        height: 95
        width: 55
        running: true
        Sprite {
            name: "standing"
            source: "qrc:/img/ai_sheet.png"
            frameX: 0
            frameY: 0
            frameWidth: 64
            frameHeight: 79
            frameCount: 6
            frameRate: 10
        }
        Sprite {
            name: "running"
            source: "qrc:/img/ai_sheet.png"
            frameX: 0
            frameY: 79
            frameWidth: 55
            frameHeight: 77
            frameCount: 8
            frameRate: 10
        }
        Sprite {
            name: "jumping"
            source: "qrc:/img/ai_sheet.png"
            frameX: 0
            frameY: 156
            frameWidth: 62
            frameHeight: 76
            frameCount: 7
            frameRate: 10
        }
        Sprite {
            name: "attack"
            source: "qrc:/img/ai_sheet.png"
            frameX: 0
            frameY: 232
            frameWidth: 64
            frameHeight: 81
            frameCount: 20
            frameRate: 20
        }
        transform: [
            Scale {
                origin.x: sprite.width / 2
                xScale: mirrored ? -1 : 1
            }
        ]
    }
    states: [
        State {
            when: inAir
            StateChangeScript {
                script: sprite.jumpTo("jumping");
            }
        },
        State {
            when: !inAir && going
            StateChangeScript {
                script: sprite.jumpTo("running");
            }
        },
        State {
            when: !inAir && !going && !attack
            StateChangeScript {
                script: sprite.jumpTo("standing");
            }
        },
        State {
            when: !inAir && !going && attack
            StateChangeScript {
                script: sprite.jumpTo("attack");
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
