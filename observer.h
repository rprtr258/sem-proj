#ifndef OBSERVER_H
#define OBSERVER_H

#include <QQuickItem>

class Observer {
    public:
        virtual ~Observer() {}
        virtual QQuickItem* createBullet(qint32 x, qint32 y);
        virtual QQuickItem* createPlayer(qint32 x, qint32 y);
};

#endif // OBSERVER_H
