#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include "helper.h"
#include <QOpenGLWidget>
#include <QKeyEvent>

class MainWindow : public QOpenGLWidget {
    public:
        MainWindow(QWidget *parent = nullptr);
        void keyPressEvent(QKeyEvent *event) override;

    public slots:
        void animate();

    private:
        void paintEvent(QPaintEvent *event) override;

    private:
        Helper *helper;
        int elapsed;
};

#endif // MAINWINDOW_H
