import QtQuick 2.0
import QtQuick.Particles 2.0

Item {
    id: item
    property real dir : 180
    ParticleSystem {
        id: particleSystem
        anchors.fill: parent
        Emitter {
            anchors.centerIn: parent
            width: 10;
            height: 10
            emitRate: 50
            size: 10

            velocity: AngleDirection {
                angleVariation: 5
                angle: dir
                magnitude: 200
            }
        }
        ImageParticle {
            source: "qrc:/img/star.png"
            rotationVariation: 10
            color: Qt.red
        }
    }
//    Rectangle {
//        anchors.centerIn: parent
//        height: 10
//        width: 10
//        color: "black"
//    }
}
