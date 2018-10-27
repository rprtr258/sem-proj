#ifndef BULLET_H
#define BULLET_H

#include <QQmlListProperty>
#include <QQuickItem>

class Bullet : public QQuickItem {
    Q_OBJECT
    Q_PROPERTY(qint32 xCoord READ x WRITE setX NOTIFY xChanged)
    public:
        Bullet();
        qint32 x() {
            emit xChanged();
            return m_x;
        }
        void setX(qint32 value) {
            if (m_x == value)
                return;
            m_x = value;
            emit xChanged();
        }
    signals:
        void xChanged();
    private:
        qint32 m_x = 150;
};

#endif // BULLET_H
