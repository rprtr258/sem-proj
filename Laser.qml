import QtQuick 2.0

Item {
    id: item
    property int finishX
    property int finishY

    property int playerX
    property int playerY
    height: 700
    width: 700

    Canvas {
        id: drawingCanvas
        anchors.fill: parent
        onPaint: {
            var ctx = getContext("2d")

            ctx.lineWidth = 10;
            ctx.strokeStyle = "red"
            ctx.beginPath()
            ctx.moveTo(finishX, finishY)
            ctx.lineTo(playerX, playerY)
            //ctx.closePath()
            ctx.stroke()
        }
    }
}
