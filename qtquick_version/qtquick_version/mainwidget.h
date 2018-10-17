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
        void keyPressedEvent(int key, int modifier);
        void keyReleasedEvent(int key, int modifier);
    private:
        QTimer gameTimer;
        World *world;
};

#endif // MAINWIDGET_H
