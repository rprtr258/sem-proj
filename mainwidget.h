#ifndef MAINWIDGET_H
#define MAINWIDGET_H

#include <QQuickView>
#include <QTimer>

#include "world.h"

class MainWidget : public QQuickView, public Observer {
    Q_OBJECT
    public:
        MainWidget();
        ~MainWidget() override;

        QQuickItem* createBullet(qint32 x, qint32 y) override;
    public slots:
        void update();
        void keyPressedEvent(qint32 key, qint32 modifier);
        void keyReleasedEvent(qint32 key, qint32 modifier);
        void click(qint32 mouseX, qint32 mouseY);
    private:
        World *m_world;
};

#endif // MAINWIDGET_H
