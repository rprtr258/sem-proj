#ifndef MAINWIDGET_H
#define MAINWIDGET_H

#include <QQuickView>
#include <QTimer>
#include "world.h"

class MainWidget : public QQuickView {
    Q_OBJECT
    public:
        MainWidget();
        ~MainWidget() override;
    public slots:
        void update();
        void keyPressedEvent(qint32 key, qint32 modifier);
        void keyReleasedEvent(qint32 key, qint32 modifier);
        void click(int mouseX, int mouseY);
    private:
        World *m_world;
};

#endif // MAINWIDGET_H
