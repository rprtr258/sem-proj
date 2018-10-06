#include "mainwindow.h"
#include <QPainter>
#include <QTimer>

MainWindow::MainWindow(QWidget *parent) : QOpenGLWidget(parent) {
    x = 170;
    speed = 5;
    background = QBrush(QColor(64, 32, 64));
    circleBrush = QBrush(QColor(0xa6, 0xce, 0x39));
    circlePen = QPen(Qt::black);
    circlePen.setWidth(10);

    QTimer *timer = new QTimer(this);
    connect(timer, &QTimer::timeout, this, &MainWindow::animate);
    timer->start(50);
    elapsed = 0;
    setAutoFillBackground(false);
}

void MainWindow::keyPressEvent(QKeyEvent *event) {
    if (event->key() == Qt::Key_A) {
        move(-speed);
    } else if (event->key() == Qt::Key_D) {
        move(speed);
    }
}

void MainWindow::keyReleaseEvent(QKeyEvent *event) {
    Q_UNUSED(event)
}

void MainWindow::paint(QPainter *painter, QPaintEvent *event, int elapsed) {
    Q_UNUSED(elapsed)
    painter->fillRect(event->rect(), background);
    painter->save();
    painter->setBrush(circleBrush);
    painter->setPen(circlePen);
    painter->drawEllipse(QRectF(x, 0, 100, 100));
    painter->restore();
}

void MainWindow::move(int dx) {
    x += dx;
}

void MainWindow::animate() {
    elapsed += qobject_cast<QTimer*>(sender())->interval();
    update();
}

void MainWindow::paintEvent(QPaintEvent *event) {
    QPainter painter;
    painter.begin(this);
    painter.setRenderHint(QPainter::Antialiasing);
    paint(&painter, event, elapsed);
    painter.end();
}
