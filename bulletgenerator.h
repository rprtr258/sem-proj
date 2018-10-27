#ifndef BULLETGENERATOR_H
#define BULLETGENERATOR_H

#include <QObject>

struct BulletGenerator : public QObject {
    Q_OBJECT
    public:
        void f(qint32 value) {
            emit createBullet(value);
        }
    signals:
        void createBullet(qint32 xxx);
};

#endif // BULLETGENERATOR_H
