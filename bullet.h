#ifndef BULLET_H
#define BULLET_H

#include <QObject>

class Bullet : public QObject {
    Q_OBJECT
    Q_PROPERTY(qint32 x READ x NOTIFY xChanged)
    public:
        Bullet();
        qint32 x() {
            emit xChanged();
            return m_x;
        }
    signals:
        void xChanged();
    private:
        qint32 m_x = 150;
};

#endif // BULLET_H
