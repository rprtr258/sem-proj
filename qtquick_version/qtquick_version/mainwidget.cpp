#include "mainwidget.h"
#include <QQmlContext>

MainWidget::MainWidget() : QQuickView() {
    world = new World();

    setResizeMode(QQuickView::SizeRootObjectToView);
    setSource(QUrl("qrc:/main.qml"));

    connect(&gameTimer, &QTimer::timeout, this, &MainWidget::update);
    gameTimer.setInterval(20);
    connect(findChild<QObject*>("gameView"), SIGNAL(keyPressed(int, int)), this, SLOT(keyPressedEvent(int, int)));
    connect(findChild<QObject*>("gameView"), SIGNAL(keyReleased(int, int)), this, SLOT(keyReleasedEvent(int, int)));

    rootContext()->setContextProperty("player", world->getPlayer());

    QTimer *timer = new QTimer(this);
    connect(timer, &QTimer::timeout, this, &MainWidget::update);
    timer->start(20);
}

MainWidget::~MainWidget() {
    delete world;
}

void MainWidget::update() {
    world->update();
}

void MainWidget::keyPressedEvent(int key, int modifier) {
    Q_UNUSED(modifier)
    world->keyPressEvent(key);
    //qDebug() << key;
}

void MainWidget::keyReleasedEvent(int key, int modifier) {
    Q_UNUSED(modifier)
    world->keyReleaseEvent(key);
}
