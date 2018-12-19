import QtQuick 2.0
import QtQuick.Particles 2.0

Item {
    id: item
    property real dir : 180
    Image {
        anchors.centerIn: parent
        source: "qrc:/img/bullet.png"
        rotation: dir
    }

    ParticleSystem {
        id: particleSystem
        anchors.fill: parent
        Emitter {
            anchors.centerIn: parent
            width: 10;
            height: 10
            emitRate: dir == 0 ? 0 : 70
            size: 10
            lifeSpan: 700

            velocity: AngleDirection {
                angleVariation: 3
                angle: dir
                magnitude: 200
                magnitudeVariation: 20
            }
        }
        ImageParticle {
            source: "qrc:/img/star.png"
            rotationVariation: 10
            color: "blue"
            entryEffect: ImageParticle.Scale
        }
    }
}
