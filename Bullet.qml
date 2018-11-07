import QtQuick 2.0
import QtQuick.Particles 2.0

Item {
    id: item
    Rectangle {
        id: r
        anchors.centerIn: parent
        height: 10
        width: 10
        color: "black"
    }

    /*ParticleSystem {
        id: particleSystem
        anchors.fill: parent

        Emitter {
            anchors.centerIn: parent
            width: 50; height: 50
            emitRate: 50

            velocity: AngleDirection {
                angleVariation: 30
                angle: 180
                magnitude: 200
            }
        }

        ImageParticle {
            source: "qrc:/img/star.png"
            colorVariation: 10000
        }
    }*/
}
