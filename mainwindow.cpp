#include "mainwindow.h"
#include <QTimer>

MainWindow::MainWindow(QWidget *parent) : QOpenGLWidget(parent) {
    world = new World();
    background = QBrush(QColor(64, 32, 64));

    QTimer *timer = new QTimer(this);
    connect(timer, &QTimer::timeout, this, &MainWindow::animate);
    timer->start(1);
    elapsed = 0;
    setAutoFillBackground(false);
}

MainWindow::~MainWindow() {
    delete world;
}

void MainWindow::keyPressEvent(QKeyEvent *event) {
    world->keyPressEvent(event);
}

void MainWindow::keyReleaseEvent(QKeyEvent *event) {
    Q_UNUSED(event)
}

void MainWindow::animate() {
    elapsed += qobject_cast<QTimer*>(sender())->interval();
    world->update();
    update();
}

void MainWindow::paintEvent(QPaintEvent *event) {
    QPainter painter;
    painter.begin(this);
    painter.setRenderHint(QPainter::Antialiasing);
    paint(&painter, event, elapsed);
    painter.end();
}

void MainWindow::paint(QPainter *painter, QPaintEvent *event, int elapsed) {
    Q_UNUSED(elapsed)
    painter->fillRect(event->rect(), background);
    painter->save();
    world->draw(painter);
    painter->restore();
}
