#ifndef MAINWIDGET_H
#define MAINWIDGET_H

#include <QQuickView>
#include <QTimer>
#include "world.h"

class MainWidget : public QQuickView, public Bridge {
    Q_OBJECT
    public:
        MainWidget();
        ~MainWidget() override;
        QQuickItem* createCharacter(qint32 x, qint32 y, qint32 type) override;
        QQuickItem* createBullet(qint32 x, qint32 y) override;
        QQuickItem* createLaser(QVector2D mouseCoord, QVector2D playerCoord) override;
        QQuickItem* createGrenade(qint32 x, qint32 y) override;

        void addCreature(Creature *creature) override;
    public slots:
        void update();
        void keyPressedEvent(qint32 key, qint32 modifier);
        void keyReleasedEvent(qint32 key, qint32 modifier);
        void click(qint32 mouseX, qint32 mouseY);
        bool event(QEvent *event) override;
    private:
        World *m_world;
};

#endif // MAINWIDGET_H
