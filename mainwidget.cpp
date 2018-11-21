#include <QQmlComponent>
#include <QQmlContext>
#include <QQuickItem>
#include <QQmlEngine>
#include "mainwidget.h"
#include <iostream>
#include "map.h"

MainWidget::MainWidget() : QQuickView() {
    m_world = new World(this);

    rootContext()->setContextProperty("player", m_world->getPlayer());

    setMinimumSize(QSize(640, 480));
    setMaximumSize(QSize(640, 480));
    setSource(QUrl("qrc:/main.qml"));

    connect(findChild<QObject*>("gameView"), SIGNAL(keyPressed(qint32, qint32)), this, SLOT(keyPressedEvent(qint32, qint32)));
    connect(findChild<QObject*>("gameView"), SIGNAL(keyReleased(qint32, qint32)), this, SLOT(keyReleasedEvent(qint32, qint32)));
    connect(findChild<QObject*>("gameView"), SIGNAL(worldUpdate()), this, SLOT(update()));
    connect(findChild<QObject*>("gameView"), SIGNAL(mousePressed(int, int)), this, SLOT(click(int, int)));
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

void MainWidget::click(qint32 mouseX, qint32 mouseY) {
    m_world->click(mouseX, mouseY);
}

QQuickItem* MainWidget::createBullet(qint32 x, qint32 y) {
    QVariant retVal;
    QMetaObject::invokeMethod(findChild<QQuickItem*>("gameView"), "createBullet", Qt::DirectConnection,
                              Q_RETURN_ARG(QVariant, retVal),
                              Q_ARG(QVariant, x),
                              Q_ARG(QVariant, y));
    return qvariant_cast<QQuickItem*>(retVal);
}

QQuickItem* MainWidget::createLaser(QVector2D position, QVector2D playerCoord) {
    QVariant retVal;
    QMetaObject::invokeMethod(findChild<QQuickItem*>("gameView"), "createLaser", Qt::DirectConnection,
                              Q_RETURN_ARG(QVariant, retVal),
                              Q_ARG(QVariant, position.x()),
                              Q_ARG(QVariant, position.y()),
                              Q_ARG(QVariant, playerCoord.x()),
                              Q_ARG(QVariant, playerCoord.y()));
    return qvariant_cast<QQuickItem*>(retVal);
}

QQuickItem* MainWidget::createGrenade(qint32 x, qint32 y) {
    QVariant retVal;
    QMetaObject::invokeMethod(findChild<QQuickItem*>("gameView"), "createGrenade", Qt::DirectConnection,
                              Q_RETURN_ARG(QVariant, retVal),
                              Q_ARG(QVariant, x),
                              Q_ARG(QVariant, y));
    return qvariant_cast<QQuickItem*>(retVal);
}

