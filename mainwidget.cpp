#include <QQmlComponent>
#include <QQmlContext>
#include <QQuickItem>
#include <QQmlEngine>
#include "mainwidget.h"

MainWidget::MainWidget() : QQuickView() {
    m_world = new World();

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
QQuickItem *i = nullptr;
int xx = 0;
void MainWidget::update() {
    m_world->update();
    if (i != nullptr) {
        i->setProperty("x", xx);
        xx = (xx + 10) % 640;
    }
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

void MainWidget::click(int mouseX, int mouseY) {
    i = createBullet(mouseX, mouseY);
}

QQuickItem* MainWidget::createBullet(int x, int y) {
    QVariant retVal;
    QMetaObject::invokeMethod(findChild<QQuickItem*>("gameView"), "createBullet", Qt::DirectConnection,
                              Q_RETURN_ARG(QVariant, retVal),
                              Q_ARG(QVariant, x),
                              Q_ARG(QVariant, y));
    xx = x;
    return qvariant_cast<QQuickItem*>(retVal);
}
