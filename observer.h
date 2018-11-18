#ifndef OBSERVER_H
#define OBSERVER_H

#include <QQuickItem>

class Observer {
    public:
        virtual QQuickItem* createBullet(qint32 x, qint32 y) = 0;
        virtual QQuickItem* createLaser(QVector2D mouseCoord, QVector2D playerCoord) = 0;
        //virtual QQuickItem* createLevel(Level &level) = 0;
};

#endif // OBSERVER_H
