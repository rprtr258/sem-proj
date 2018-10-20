#include "mainwidget.h"
#include <QQmlContext>

MainWidget::MainWidget() : QQuickView() {
    m_world = new World();

    rootContext()->setContextProperty("player", m_world->getPlayer());

    setMinimumSize(QSize(640, 480));
    setMaximumSize(QSize(640, 480));
    setSource(QUrl("qrc:/main.qml"));

    connect(findChild<QObject*>("gameView"), SIGNAL(keyPressed(qint32, qint32)), this, SLOT(keyPressedEvent(qint32, qint32)));
    connect(findChild<QObject*>("gameView"), SIGNAL(keyReleased(qint32, qint32)), this, SLOT(keyReleasedEvent(qint32, qint32)));
    connect(findChild<QObject*>("gameView"), SIGNAL(worldUpdate()), this, SLOT(update()));
}

MainWidget::~MainWidget() {
    delete m_world;
}

void MainWidget::update() {
    m_world->update();
}

void MainWidget::keyPressedEvent(qint32 key, qint32 modifier) {
    Q_UNUSED(modifier)
    m_world->keyPressEvent(key);
    //qDebug() << key;
}

void MainWidget::keyReleasedEvent(qint32 key, qint32 modifier) {
    Q_UNUSED(modifier)
    m_world->keyReleaseEvent(key);
}
